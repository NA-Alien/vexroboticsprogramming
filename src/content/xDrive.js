const program = `#include "vex.h"
#include <algorithm>
#include <cmath>
using namespace vex;

motor frontLeft(PORT1, ratio18_1, false);
motor frontRight(PORT2, ratio18_1, true);
motor backLeft(PORT3, ratio18_1, false);
motor backRight(PORT4, ratio18_1, true);
controller driver(primary);
competition match;

double deadband(double input) {
  return std::fabs(input) < 5 ? 0 : input;
}

void stopXDrive() {
  frontLeft.stop(brake);
  frontRight.stop(brake);
  backLeft.stop(brake);
  backRight.stop(brake);
}

void driveX(double forwardPct, double rightPct, double turnPct) {
  double fl = forwardPct + rightPct + turnPct;
  double fr = forwardPct - rightPct - turnPct;
  double bl = forwardPct - rightPct + turnPct;
  double br = forwardPct + rightPct - turnPct;
  double peak = std::max({100.0, std::fabs(fl), std::fabs(fr),
                         std::fabs(bl), std::fabs(br)});
  double scale = 100.0 / peak;

  if (fl == 0 && fr == 0 && bl == 0 && br == 0) {
    stopXDrive();
    return;
  }
  frontLeft.spin(forward, fl * scale, pct);
  frontRight.spin(forward, fr * scale, pct);
  backLeft.spin(forward, bl * scale, pct);
  backRight.spin(forward, br * scale, pct);
}

void autonomous() {
  driveX(0, 20, 0);
  wait(300, msec);
  stopXDrive();
}

void driverControl() {
  while (true) {
    driveX(deadband(driver.Axis3.position(percent)),
           deadband(driver.Axis4.position(percent)),
           deadband(driver.Axis1.position(percent)));
    wait(20, msec);
  }
}

int main() {
  vexcodeInit();
  match.autonomous(autonomous);
  match.drivercontrol(driverControl);
  while (true) wait(100, msec);
}`;

const fieldControl = `inertial imu(PORT5);
bool headingReady = false;
constexpr double pi = 3.141592653589793;

void calibrateHeading() {
  headingReady = false;
  if (!imu.installed()) return;
  imu.calibrate();
  timer calibration;
  while (imu.isCalibrating() && calibration.time(msec) < 5000)
    wait(20, msec);
  if (imu.isCalibrating()) return;
  imu.setRotation(0, degrees);
  headingReady = true;
}

void driverControl() {
  while (true) {
    if (!headingReady || !imu.installed() || imu.isCalibrating()) {
      stopXDrive();
      wait(20, msec);
      continue;
    }
    double fieldForward = deadband(driver.Axis3.position(percent));
    double fieldRight = deadband(driver.Axis4.position(percent));
    double heading = imu.rotation(degrees) * pi / 180.0;
    double robotForward = fieldForward * std::cos(heading)
                        + fieldRight * std::sin(heading);
    double robotRight = -fieldForward * std::sin(heading)
                      + fieldRight * std::cos(heading);
    driveX(robotForward, robotRight,
           deadband(driver.Axis1.position(percent)));
    wait(20, msec);
  }
}`;

export const xDrive = {
  slug: 'x-drive', title: 'Programming an X-drive', shortTitle: 'X-drive',
  summary: 'Mix four motors for forward travel, strafing, and turning.',
  description: 'Set up a four-wheel X-drive in VEXcode C++, then add joystick control and optional field-oriented driving.',
  prerequisite: 'A four-motor X-drive with omni wheels at 45°. Use the complete project below instead of the two-motor shared configuration.',
  standalone: true,
  sources: ['vexHolonomic', 'vexMotors', 'vexAxis', 'vexCompetition', 'vexImu', 'prosTasks'],
  sections: [
    { id: 'layout', title: 'Wheel layout and directions', paragraphs: [
      'An X-drive uses four ordinary omni wheels angled at the corners of the chassis. It can move sideways without first turning. This guide assumes a symmetric chassis and wheel rolling directions at 45° to the front; it does not describe a mecanum-wheel build.',
      'Names refer to corners as viewed from above. Configure each motor so a positive command rolls that corner in the forward-pointing direction shown below. The example reversal flags are starting values, not a substitute for checking your mounting and gears.'
    ], diagram: 'x-drive', table: { headings: ['Motor', 'Example Smart Port', 'Positive rolling direction'], rows: [['frontLeft', '1', 'Forward and right'], ['frontRight', '2', 'Forward and left'], ['backLeft', '3', 'Forward and left'], ['backRight', '4', 'Forward and right']] }, sources: ['vexHolonomic', 'vexMotors'] },
    { id: 'mixing', title: 'Combine forward, sideways, and turn', paragraphs: [
      'Use forward-positive, right-positive, and clockwise-positive commands. Each wheel receives the sum of its contribution to those three movements. These are motor-output commands, not measured chassis speeds.',
      'For a right strafe, front-left and back-right are positive while the other two are negative. For a clockwise turn, the left motors are positive and the right motors are negative. The signs follow the wheel directions in the diagram.',
      'When a mixed command exceeds 100%, scale all four outputs by the same factor. Clipping each motor separately changes the requested direction. For example, forward 60 plus right 60 produces 120, 0, 0, 120; normalization makes that 100, 0, 0, 100.'
    ], formula: 'frontLeft  = forward + right + turn\nfrontRight = forward − right − turn\nbackLeft   = forward − right + turn\nbackRight  = forward + right − turn\n\nscale = 100 / max(100, largest absolute wheel command)', sources: ['vexMotors'] },
    { id: 'driver-control', title: 'A complete driver-control project', paragraphs: [
      'Start with an empty V5 C++ project. Replace src/main.cpp with this example; do not paste it beneath the shared tank-drive program. If you configured these devices in the Devices window, remove the duplicate declarations or use your generated device names consistently.',
      'The left stick controls forward/backward and left/right movement. The right stick controls turning. This is robot-oriented: pushing forward always moves toward the robot’s front, wherever the robot is facing. The small deadband keeps a resting stick from moving the robot.',
      'The autonomous callback is only a 300 ms right-strafe direction test at 20% output. Start it through competition control. It does not measure distance. These examples have not been compiled with the VEX toolchain or tested on a physical X-drive.'
    ], code: program, codeLabel: 'main.cpp · complete robot-oriented X-drive example', sources: ['vexMotors', 'vexAxis', 'vexCompetition', 'prosTasks'] },
    { id: 'testing', title: 'Check each movement separately', steps: [
      'With the wheels clear of the floor, test each motor at low output. Confirm its name, port, and positive rolling direction against the diagram. Stop the program before changing wiring.',
      'On clear floor space, test forward only, then right only, then clockwise turn only. Begin with small stick inputs.',
      'If one wheel disagrees with the table, correct its reversed flag. If all wheels match but the robot moves incorrectly, check wheel angles, roller freedom, and ground contact.',
      'Try diagonal movement, then translation while turning. Confirm the outputs remain bounded and the sticks stop the drive when released.'
    ], table: { headings: ['Command', 'Front left', 'Front right', 'Back left', 'Back right'], rows: [['Forward', '+', '+', '+', '+'], ['Right', '+', '−', '−', '+'], ['Clockwise', '+', '−', '+', '−']] }, sources: ['vexMotors'] },
    { id: 'field-control', title: 'Optional: field-oriented control', paragraphs: [
      'Field-oriented control keeps the left stick aligned with a fixed field direction while the robot turns. It needs a heading reference. Here, field forward is the direction the robot faces when calibration finishes; positive heading is clockwise, matching the default VEX inertial rotation convention.',
      'Keep driveX(), stopXDrive(), and deadband(). Add the sensor, state, and calibration function below before driverControl(), and replace driverControl() with this version. In main(), call calibrateHeading() immediately after vexcodeInit(), before registering the competition callbacks. Keep the robot stationary during calibration. Do not also define a second imu or pi from another guide.',
      'Face field forward when establishing zero. At a clockwise heading of 90°, pushing field forward should request robot-left travel. Check that case at low output. A bad zero or reversed heading sign rotates the controls incorrectly. The autonomous test remains robot-oriented.'
    ], code: fieldControl, codeLabel: 'main.cpp · optional inertial setup and replacement driverControl()', sources: ['vexImu', 'vexAxis'] },
    { id: 'autonomous', title: 'Using an X-drive in autonomous', paragraphs: [
      'Reuse driveX() as the final motor-output step. A position controller can calculate a field-forward and field-right correction, rotate them into robot coordinates with the same transformation used above, and pass them to driveX() with a heading correction. Match the coordinate and angle conventions before combining examples.',
      'The Simple autonomous and Driving to coordinates examples on this site send commands to a left and right tank drive. They are not drop-in X-drive controllers. Keep their ideas—feedback, output limits, settling checks, and timeouts—but replace their motor mixing and account for sideways movement.',
      'Do not equate motor-wheel travel with straight chassis travel: the wheels roll at an angle, and their encoders also change during turning. For ideal forward-only travel at 45°, each wheel rolls chassis distance × cos(45°), so chassis distance is wheel travel × √2. Include external gearing when converting motor rotation to wheel travel. Slip still changes the result. Independent tracking wheels can measure forward and sideways motion for odometry.',
      'For closed-loop tests, start with one axis at a time, stop all four motors on timeout or invalid sensor data, and tune on your own robot before combining motion axes.'
    ], sources: ['vexHolonomic', 'vexMotors', 'vexImu', 'prosTasks'] }
  ]
};
