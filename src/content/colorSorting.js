export const sorterCode = `motor intake(PORT3, ratio18_1, false);
optical colorSensor(PORT9);

bool unwantedColor(double hue, bool rejectRed) {
  if (!std::isfinite(hue) || hue < 0 || hue >= 360) return false;
  return rejectRed ? (hue >= 340 || hue <= 20)
                   : (hue >= 200 && hue <= 240);
}

void sortFor(double durationMs, bool rejectRed) {
  intake.stop(coast);
  if (!std::isfinite(durationMs) || durationMs <= 0) return;

  colorSensor.setLightPower(50, pct);
  timer elapsed, phase;
  elapsed.reset();
  phase.reset();
  enum class SortState { feeding, rejecting, clearing };
  SortState state = SortState::feeding;
  int matchingSamples = 0;

  while (elapsed.time(msec) < durationMs) {
    bool near = colorSensor.isNearObject();

    if (state == SortState::rejecting) {
      intake.spin(reverse, 60, pct);
      if (phase.time(msec) >= 150) {
        state = SortState::clearing;
        phase.reset();
      }
    } else {
      intake.spin(forward, 60, pct);
      if (state == SortState::clearing) {
        if (near) phase.reset();
        else if (phase.time(msec) >= 50) {
          state = SortState::feeding;
          matchingSamples = 0;
        }
      } else {
        bool reject = near && unwantedColor(colorSensor.hue(), rejectRed);
        matchingSamples = reject ? matchingSamples + 1 : 0;
        if (matchingSamples >= 3) {
          state = SortState::rejecting;
          phase.reset();
          intake.spin(reverse, 60, pct);
        }
      }
    }
    wait(10, msec);
  }

  intake.stop(coast);
  colorSensor.setLight(ledState::off);
}

void autonomous() {
  stopDrive();
  sortFor(10000, true);
}`;

export const colorSorting = {
  slug: 'color-sorting', title: 'Color sorting', shortTitle: 'Color sorting',
  summary: 'Filter optical readings and reverse an intake to reject the unwanted ring color.',
  description: 'Use an Optical Sensor to distinguish red and blue rings, then time an intake reversal to eject one color.',
  prerequisite: 'Shared main.cpp, an intake that can eject rings by reversing, and a V5 Optical Sensor. Start with the stationary sensor test in Reading sensors.',
  sources: ['vexOptical', 'vexMotors', 'prosTasks'],
  sections: [
    { id: 'placement', title: 'Place the sensor before the rejection point', paragraphs: [
      'Mount the Optical Sensor where one ring passes close to its sensing face. Keep its distance and angle consistent, and shield it from changing light when possible. Arrange the intake so reversing can actually send the ring out instead of pulling another ring into it.',
      'This example reverses the intake itself. A robot with a separate conveyor, diverter, or pneumatic gate needs a different rejection action. Software cannot separate two rings that reach the sensor together.'
    ], diagram: 'sorting', sources: ['vexOptical'] },
    { id: 'hue', title: 'Choose red and blue hue ranges', paragraphs: [
      'Check isNearObject() before reading hue. Hue is an angle from 0° to just below 360°, so red crosses the boundary at zero. VEX documents red around 340–20° and blue around 200–240°. Treat these as initial ranges to measure against your rings, not universal calibration values.',
      'Set a fixed LED power, then record hue with no ring, a red ring, and a blue ring. Repeat with the intake moving. If the ranges overlap or change widely, improve the mounting and lighting before widening the thresholds.'
    ], table: { headings: ['Reading', 'Classification'], rows: [['No nearby object', 'No color decision'], ['340° through 359.99°, or 0° through 20°', 'Red candidate'], ['200° through 240°', 'Blue candidate'], ['Anything else', 'Unknown; keep feeding in this example']] }, sources: ['vexOptical'] },
    { id: 'filter', title: 'Require consecutive matching samples', paragraphs: [
      'A single hue reading near a ring’s edge can flicker. The example requires three consecutive readings of the unwanted color before rejecting. A missing object, unknown color, or wanted color resets the count. With a 10 ms wait, confirmation takes roughly 20–30 ms plus execution time.',
      'Avoid averaging hue directly across zero: 359° and 1° are both red, but their arithmetic average is 180°. Classifying each sample before counting avoids that problem. Filtering also adds delay; a fast ring may leave the rejection point before confirmation finishes.'
    ] },
    { id: 'sorter', title: 'A timed intake sorter', paragraphs: [
      'Add the device declarations and helpers above autonomous(), then replace that callback with the one below. Use Port 3 for the intake and Port 9 for the optical sensor, or change them to match your robot. Reuse existing device objects instead of declaring duplicates. Confirm forward pulls rings in and reverse ejects them.',
      'sortFor(10000, true) runs for ten seconds and rejects red. Use false to reject blue. It reverses for 150 ms, resumes feeding, and waits for the sensor to remain clear for 50 ms before allowing another rejection. Those times and the 60% motor output need testing on your mechanism.',
      'This is a stationary, blocking test: the drivetrain is stopped while sorting runs. The loop controls the intake until the duration expires, then stops it and switches off the sensor light. It does not detect a jam or guarantee the ring was ejected.'
    ], code: sorterCode, codeLabel: 'main.cpp · stationary color-sorting test', sources: ['vexOptical', 'vexMotors'] },
    { id: 'timing', title: 'Match the timing to the mechanism', paragraphs: [
      'Place the sensor so the color decision happens before the ring passes the place where it can be ejected. The available time depends on the distance between those points and the ring’s travel speed. This example starts reversing immediately after confirmation; it does not track the ring to a later gate.',
      'After a rejection, the clear interval prevents the same ring from triggering repeatedly. If another ring arrives before that interval finishes, the example will let it pass. Space rings apart for this first test. A continuous high-throughput sorter needs object tracking or a queue, plus a way to confirm clearance.'
    ], formula: 'available time ≈ sensor-to-rejection distance ÷ ring speed\nrequired time = detection delay + motor response + ejection time' },
    { id: 'integration', title: 'Use sorting during driver control or autonomous', paragraphs: [
      'Do not call sortFor() inside a driver-control loop: it would delay joystick updates until it finishes. For simultaneous driving and sorting, turn the state-machine body into a short update function called by the loop that owns the intake. Use elapsed time between updates rather than long waits.',
      'Give manual reverse and stop commands priority over sorting, and reset the rejection state when changing modes or disabling sorting. Keep one owner for the intake motor; an ordinary intake helper and a sorter must not fight over its output. Add a stop or timeout if a ring stays at the sensor longer than expected.'
    ], sources: ['prosTasks', 'vexMotors'] },
    { id: 'testing', title: 'Test one ring at a time', steps: [
      'Run the stationary optical test and record both colors under normal lighting.',
      'With the mechanism clear, check intake forward and reverse at low output.',
      'Feed one wanted ring. It should continue through without a reversal.',
      'Feed one unwanted ring. Adjust reversal duration until it exits reliably.',
      'Try an unknown object and a ring held in front of the sensor. Confirm the fallback and stop behavior.',
      'Repeat at realistic intake speed, then try separated pairs. Record missed detections and repeated triggers before adding simultaneous driving.'
    ] }
  ]
};
