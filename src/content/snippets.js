export const setup = `#include "vex.h"
#include <cmath>
#include <algorithm>
using namespace vex;

motor leftDrive(PORT1, ratio18_1, false);
motor rightDrive(PORT10, ratio18_1, true);
inertial imu(PORT5);
controller driver(primary);
competition match;
bool sensorsReady = false;
constexpr double pi = 3.141592653589793;

double limit(double value, double low, double high) {
  return std::max(low, std::min(high, value));
}
double wrap180(double angle) {
  while (angle > 180) angle -= 360;
  while (angle < -180) angle += 360;
  return angle;
}
void stopDrive() {
  leftDrive.stop(brake);
  rightDrive.stop(brake);
}
void preAuton() {
  vexcodeInit();
  if (!imu.installed()) return;
  imu.calibrate();
  timer calibration;
  calibration.reset();
  while (imu.isCalibrating() && calibration.time(msec) < 5000)
    wait(20, msec);
  sensorsReady = !imu.isCalibrating();
}
void autonomous() {
  if (!sensorsReady) { stopDrive(); return; }
}
void driverControl() {
  while (true) {
    double drive = driver.Axis3.position(percent);
    double turn = driver.Axis1.position(percent);
    leftDrive.spin(forward, limit(drive + turn, -100, 100), pct);
    rightDrive.spin(forward, limit(drive - turn, -100, 100), pct);
    wait(20, msec);
  }
}
int main() {
  match.autonomous(autonomous);
  match.drivercontrol(driverControl);
  preAuton();
  while (true) wait(100, msec);
}`;

export const firstMove = `void autonomous() {
  if (!sensorsReady) { stopDrive(); return; }
  leftDrive.spin(forward, 20, pct);
  rightDrive.spin(forward, 20, pct);
  wait(300, msec);
  stopDrive();
}`;

export const drive = `constexpr double wheelDiameter = 3.25;
constexpr double motorTurnsPerWheelTurn = 1.0;

double motorDegreesToInches(double degreesMoved) {
  return degreesMoved / 360.0 / motorTurnsPerWheelTurn
       * pi * wheelDiameter;
}

bool driveDistance(double inches, double maxPct = 40,
                   double timeoutMs = 2500) {
  if (!std::isfinite(inches) || maxPct <= 0 || timeoutMs <= 0)
    { stopDrive(); return false; }
  maxPct = limit(maxPct, 1, 100);
  const double leftStart = leftDrive.position(degrees);
  const double rightStart = rightDrive.position(degrees);
  timer elapsed;
  elapsed.reset();
  int settledMs = 0;
  while (elapsed.time(msec) < timeoutMs) {
    double leftDistance = motorDegreesToInches(
      leftDrive.position(degrees) - leftStart);
    double rightDistance = motorDegreesToInches(
      rightDrive.position(degrees) - rightStart);
    double leftError = inches - leftDistance;
    double rightError = inches - rightDistance;
    bool inside = std::fabs(leftError) < 0.3 && std::fabs(rightError) < 0.3;
    settledMs = inside ? settledMs + 10 : 0;
    if (settledMs >= 100) { stopDrive(); return true; }
    leftDrive.spin(forward, limit(5.0 * leftError, -maxPct, maxPct), pct);
    rightDrive.spin(forward, limit(5.0 * rightError, -maxPct, maxPct), pct);
    wait(10, msec);
  }
  stopDrive();
  return false;
}`;

export const turn = `bool turnToHeading(double targetHeading, double timeoutMs = 2500) {
  if (!sensorsReady || !std::isfinite(targetHeading) || timeoutMs <= 0)
    { stopDrive(); return false; }
  timer elapsed;
  elapsed.reset();
  int settledMs = 0;
  while (elapsed.time(msec) < timeoutMs) {
    double error = wrap180(targetHeading - imu.heading(degrees));
    settledMs = std::fabs(error) < 1.5 ? settledMs + 10 : 0;
    if (settledMs >= 150) { stopDrive(); return true; }
    double output = limit(0.7 * error, -35, 35);
    leftDrive.spin(forward, output, pct);
    rightDrive.spin(forward, -output, pct);
    wait(10, msec);
  }
  stopDrive();
  return false;
}`;

export const sequence = `void autonomous() {
  if (!sensorsReady) { stopDrive(); return; }
  if (!driveDistance(24)) return;
  if (!turnToHeading(90)) return;
  if (!driveDistance(-12, 30, 2000)) return;
  stopDrive();
}`;

export const mechanism = `motor intake(PORT3, ratio18_1, false);
void runIntake(double powerPct, int durationMs) {
  if (durationMs <= 0) { intake.stop(coast); return; }
  intake.spin(forward, limit(powerPct, -100, 100), pct);
  wait(durationMs, msec);
  intake.stop(coast);
}`;

export const pid = `bool turnPid(double targetHeading, double timeoutMs = 2500) {
  if (!sensorsReady || !std::isfinite(targetHeading) || timeoutMs <= 0)
    { stopDrive(); return false; }
  const double kP = 0.65, kI = 0.0, kD = 0.035;
  double integral = 0;
  double previousError = wrap180(targetHeading - imu.heading(degrees));
  double previousHeading = imu.heading(degrees);
  double settledSeconds = 0;
  timer elapsed;
  elapsed.reset();
  double previousTime = elapsed.time(msec) / 1000.0;
  while (elapsed.time(msec) < timeoutMs) {
    wait(10, msec);
    double now = elapsed.time(msec) / 1000.0;
    double dt = now - previousTime;
    if (dt <= 0) continue;
    double heading = imu.heading(degrees);
    double error = wrap180(targetHeading - heading);
    double rate = wrap180(heading - previousHeading) / dt;
    if (std::fabs(error) > 15 || error * previousError < 0)
      integral = 0;
    double nextIntegral = std::fabs(error) <= 15
      ? limit(integral + error * dt, -40, 40) : 0.0;
    double unclampedOutput = kP * error + kI * nextIntegral - kD * rate;
    double output = limit(unclampedOutput, -40, 40);
    if (std::fabs(unclampedOutput) <= 40 || unclampedOutput * error < 0) integral = nextIntegral;
    leftDrive.spin(forward, output, pct);
    rightDrive.spin(forward, -output, pct);
    bool settled = std::fabs(error) < 1.5 && std::fabs(rate) < 8;
    settledSeconds = settled ? settledSeconds + dt : 0;
    if (settledSeconds >= 0.15) { stopDrive(); return true; }
    previousTime = now;
    previousHeading = heading;
    previousError = error;
  }
  stopDrive();
  return false;
}`;

export const odom = `rotation forwardTracker(PORT7, false);
rotation sideTracker(PORT8, false);
struct Pose { double x, y, theta; };
Pose pose{0, 0, 0};
double lastForward = 0, lastSide = 0, lastHeading = 0;
double headingOffset = 0;
constexpr double trackingWheelDiameter = 2.75;
// Offsets are inches left of center and forward of center.
constexpr double forwardWheelOffset = 3.0;
constexpr double sideWheelOffset = 2.0;

double trackerInches(rotation& sensor) {
  return sensor.position(degrees) / 360.0 * pi * trackingWheelDiameter;
}
double fieldHeading() {
  return -imu.rotation(degrees) * pi / 180.0 + headingOffset;
}
void setPose(double x, double y, double theta) {
  headingOffset = theta + imu.rotation(degrees) * pi / 180.0;
  pose = {x, y, theta};
  lastHeading = theta;
  lastForward = trackerInches(forwardTracker);
  lastSide = trackerInches(sideTracker);
}
void updateOdometry() {
  double theta = fieldHeading();
  double forwardNow = trackerInches(forwardTracker);
  double sideNow = trackerInches(sideTracker);
  double headingChange = theta - lastHeading;
  double forwardChange = forwardNow - lastForward;
  double sideChange = sideNow - lastSide;
  double forwardArc = forwardChange + forwardWheelOffset * headingChange;
  double sideArc = sideChange - sideWheelOffset * headingChange;
  double scale = std::fabs(headingChange) < 1e-6
    ? 1.0 : 2.0 * std::sin(headingChange / 2.0) / headingChange;
  double forwardChord = forwardArc * scale;
  double sideChord = sideArc * scale;
  double midHeading = lastHeading + headingChange / 2.0;
  pose.x += forwardChord * std::cos(midHeading) - sideChord * std::sin(midHeading);
  pose.y += forwardChord * std::sin(midHeading) + sideChord * std::cos(midHeading);
  pose.theta = theta;
  lastForward = forwardNow;
  lastSide = sideNow;
  lastHeading = theta;
}`;

export const odomLoop = `void autonomous() {
  if (!sensorsReady) { stopDrive(); return; }
  stopDrive();
  setPose(24, 24, 0);
  timer test;
  test.reset();
  while (test.time(msec) < 10000) {
    updateOdometry();
    Brain.Screen.setCursor(1, 1);
    Brain.Screen.print("x %.1f y %.1f deg %.1f   ",
      pose.x, pose.y, pose.theta * 180.0 / pi);
    wait(10, msec);
  }
}`;

export const reset = `vex::distance frontDistance(PORT6);
constexpr double sensorForwardOffset = 5.0;
constexpr double sensorLeftOffset = 0.0;

bool resetXFromEastWall(double wallX) {
  if (!frontDistance.installed() || !frontDistance.isObjectDetected())
    return false;
  double rangeMm = frontDistance.objectDistance(mm);
  if (!std::isfinite(rangeMm) || rangeMm < 50 || rangeMm > 1500)
    return false;
  double theta = pose.theta;
  double rayX = std::cos(theta);
  if (rayX < std::cos(10.0 * pi / 180.0)) return false;
  double offsetX = sensorForwardOffset * std::cos(theta)
                 - sensorLeftOffset * std::sin(theta);
  double measuredX = wallX - offsetX - rangeMm / 25.4 * rayX;
  if (!std::isfinite(measuredX) || std::fabs(measuredX - pose.x) > 6)
    return false;
  pose.x = measuredX;
  return true;
}`;

