export const basics = `double inchesToMillimeters(double inches) {
  return inches * 25.4;
}

void autonomous() {
  const double targetInches = 24.0;
  double targetMm = inchesToMillimeters(targetInches);
  bool closeEnough = std::fabs(targetMm - 609.6) < 0.1;

  if (closeEnough) {
    Brain.Screen.print("Conversion OK");
  }
}`;

export const optical = `optical colorSensor(PORT9);

bool isRedObject() {
  if (!colorSensor.isNearObject()) return false;
  double hue = colorSensor.hue();
  return hue >= 340.0 || hue <= 20.0;
}

void autonomous() {
  stopDrive();
  colorSensor.setLightPower(50, percent);
  timer elapsed;
  elapsed.reset();
  while (elapsed.time(msec) < 10000) {
    Brain.Screen.setCursor(1, 1);
    Brain.Screen.print("near %d hue %.1f red %d   ",
      colorSensor.isNearObject(), colorSensor.hue(), isRedObject());
    wait(50, msec);
  }
  colorSensor.setLight(ledState::off);
}`;

export const arm = `motor arm(PORT4, ratio36_1, false);

bool moveArmTo(double targetMotorDegrees, double timeoutMs = 1800) {
  if (!std::isfinite(targetMotorDegrees) || timeoutMs <= 0) {
    arm.stop(hold);
    return false;
  }
  timer elapsed;
  elapsed.reset();
  int settledMs = 0;
  while (elapsed.time(msec) < timeoutMs) {
    double error = targetMotorDegrees - arm.position(degrees);
    double output = limit(0.3 * error, -25, 25);
    arm.spin(forward, output, pct);
    settledMs = std::fabs(error) < 3 ? settledMs + 10 : 0;
    if (settledMs >= 100) { arm.stop(hold); return true; }
    wait(10, msec);
  }
  arm.stop(hold);
  return false;
}`;

export const point = `bool driveToPoint(double targetX, double targetY,
                  double timeoutMs = 3500) {
  if (!sensorsReady || !std::isfinite(targetX)
      || !std::isfinite(targetY) || timeoutMs <= 0) {
    stopDrive(); return false;
  }
  timer elapsed;
  elapsed.reset();
  int settledMs = 0;
  while (elapsed.time(msec) < timeoutMs) {
    updateOdometry();
    if (!std::isfinite(pose.x) || !std::isfinite(pose.y)
        || !std::isfinite(pose.theta)) { stopDrive(); return false; }
    double dx = targetX - pose.x;
    double dy = targetY - pose.y;
    double remaining = std::sqrt(dx * dx + dy * dy);
    if (remaining < 1.0) {
      stopDrive();
      settledMs += 10;
      if (settledMs >= 150) return true;
    } else {
      settledMs = 0;
      double targetHeading = std::atan2(dy, dx);
      double headingError = wrap180(
        (targetHeading - pose.theta) * 180.0 / pi);
      double turn = limit(0.7 * headingError, -30, 30);
      double alignment = std::max(0.0,
        std::cos(headingError * pi / 180.0));
      double drive = limit(4.0 * remaining, 0, 40) * alignment;
      double left = drive - turn, right = drive + turn;
      double scale = std::max(1.0,
        std::max(std::fabs(left), std::fabs(right)) / 40.0);
      leftDrive.spin(forward, left / scale, pct);
      rightDrive.spin(forward, right / scale, pct);
    }
    wait(10, msec);
  }
  stopDrive();
  return false;
}`;

export const debug = `void showDriveReadings() {
  Brain.Screen.setCursor(1, 1);
  Brain.Screen.print("left %.1f deg       ", leftDrive.position(degrees));
  Brain.Screen.setCursor(2, 1);
  Brain.Screen.print("right %.1f deg      ", rightDrive.position(degrees));
  Brain.Screen.setCursor(3, 1);
  Brain.Screen.print("heading %.1f deg    ", imu.heading(degrees));
  Brain.Screen.setCursor(4, 1);
  Brain.Screen.print("ready %d            ", sensorsReady);
}
void autonomous() {
  stopDrive();
  timer elapsed;
  elapsed.reset();
  while (elapsed.time(msec) < 10000) {
    showDriveReadings();
    wait(100, msec);
  }
}`;

