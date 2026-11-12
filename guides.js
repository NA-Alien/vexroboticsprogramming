import * as snippets from './snippets.js';
import { extraGuides } from './extraGuides.js';
import { colorSorting } from './colorSorting.js';

const coreGuides = [
  {
    slug: 'getting-started', title: 'Getting started', shortTitle: 'Getting started',
    summary: 'Install VS Code and the VEX extension, configure motors, and run a first program.',
    description: 'Create a VEXcode V5 C++ project and check the hardware before writing autonomous code.',
    prerequisite: 'A V5 Brain, two drive motors, an inertial sensor, and a USB cable.',
    sources: ['vscodeInstall', 'vexExtension', 'vexProject', 'vexMotors', 'vexImu', 'vexCompetition', 'prosMotors'],
    sections: [
      { id: 'vscode', title: 'Install VS Code and the VEX extension', paragraphs: [
        'Use the desktop version of Visual Studio Code with the official VEX Robotics extension. This keeps the VEX C++ API used throughout these guides; you do not need PROS for these examples.'
      ], steps: [
        'Download Visual Studio Code for your operating system from Microsoft, run the installer, and open the application.',
        'Open Extensions in the left Activity Bar. Search for VEX Robotics and install the extension published by VEX Robotics (extension ID: VEXRobotics.vexcode).',
        'In Extensions, search for C/C++ and install the extension published by Microsoft. It provides completion and error checking for C++.',
        'Open the VEX icon in the Activity Bar. If it is missing, confirm the VEX extension is enabled and reload VS Code.'
      ], links: [
        { label: 'Download VS Code', url: 'https://code.visualstudio.com/download' },
        { label: 'Official VEX Robotics extension', url: 'https://marketplace.visualstudio.com/items?itemName=VEXRobotics.vexcode' }
      ], sources: ['vscodeInstall', 'vexExtension'] },
      { id: 'project', title: 'Create the project', paragraphs: [
        'In the VEX extension, select New Project under Project Actions. Choose V5, then C/C++, then an empty template. Enter a project name and location and select Create. Open src/main.cpp in the Explorer.',
        'These examples define their own devices in main.cpp. Retain the generated vex.h and robot-config files, and avoid declaring another set of devices on the same ports. Replace the default main.cpp with the shared configuration below.',
        'If you already use the standalone VEXcode V5 editor, an empty C++ text project works too. In VS Code, use the VEX extension’s build and download controls, rather than the generic Run Code command. Connect and power on the Brain, confirm it appears in the VEX extension, and select the intended program slot before downloading.'
      ], sources: ['vexProject', 'vexMotors'] },
      { id: 'videos', title: 'Video walkthroughs by CoderSponge', paragraphs: [
        'I’m CoderSponge, the creator of this website. These two videos cover the initial setup and basic robot code. You can follow the written guide on its own or use the videos alongside it.'
      ], links: [
        { label: 'Episode 1 — Downloading VS Code / Getting Started', url: 'https://www.youtube.com/watch?v=MrLuhMFzio8' },
        { label: 'Episode 2 — Motor Configuration / Driver / Auton Code', url: 'https://www.youtube.com/watch?v=0KN05wXiOKI' },
        { label: 'CoderSponge on YouTube', url: 'https://www.youtube.com/@CoderSponge' }
      ] },
      { id: 'hardware', title: 'Configure the hardware', paragraphs: [
        'The example uses one motor per side, green 18:1 cartridges, and direct-drive 3.25-inch wheels. Change these values to match your robot. Port numbers and reversed flags are examples, not a wiring standard.',
        'With the robot lifted, a positive command must move both wheels in the robot’s forward direction. Check each motor independently. A reversed flag fixes mounting direction; it does not describe where the port is on the Brain.'
      ], table: { headings: ['Device', 'Example port', 'Configuration'], rows: [['Left drive motor', '1', '18:1 cartridge, not reversed'], ['Right drive motor', '10', '18:1 cartridge, reversed'], ['Inertial sensor', '5', 'Clockwise-positive rotation']] }, sources: ['vexMotors', 'prosMotors'] },
      { id: 'configuration', title: 'Shared main.cpp', paragraphs: [
        'Use this file as the base for later snippets. It defines the named devices, math helpers, autonomous callback, and arcade driver control. Later guides tell you which functions to add or replace; do not paste a second main() into the project.',
        'The competition object dispatches the autonomous and driver-control functions. A callback is a function registered to run when the field control changes modes.'
      ], code: snippets.setup, codeLabel: 'main.cpp · shared configuration', sources: ['vexCompetition', 'vexMotors'] },
      { id: 'calibration', title: 'Calibrate the inertial sensor', paragraphs: [
        'Keep the robot still while preAuton() calibrates the inertial sensor. The example waits for calibration to finish and stops waiting after five seconds. A disconnected sensor or unfinished calibration leaves sensorsReady false, so the autonomous examples will not drive.',
        'Heading wraps from 359.99° back to 0°. Rotation can continue through multiple turns. This distinction matters later: turning uses a wrapped heading error, while odometry uses changes in continuous rotation.'
      ], sources: ['vexImu'] },
      { id: 'first-run', title: 'Run the first movement', paragraphs: [
        'Replace autonomous() with the short test below. Lift the wheels clear of the table, download, run the project, and use a competition switch or controller competition mode to start autonomous. Both sides should turn forward for 300 milliseconds.',
        'For a temporary bench test without competition control, insert autonomous(); immediately after preAuton(); in main(). Remove that call after testing so starting the project does not trigger a movement outside autonomous mode. Test on the floor only after confirming directions.'
      ], code: snippets.firstMove, codeLabel: 'main.cpp · replace autonomous()', sources: ['vexCompetition', 'vexMotors'] },
      { id: 'troubleshooting', title: 'If the robot does not move', steps: [
        'Check the downloaded program slot, Brain battery, motor cables, and configured ports.',
        'Confirm the autonomous callback is actually being started. Pressing Run starts main(), not automatically the competition autonomous period.',
        'Check sensorsReady and the inertial cable. Do not move the robot during calibration.',
        'If one side drives backward, correct that motor’s reversed flag, download again, and repeat the lifted-wheel test.'
      ], paragraphs: ['Once direction and calibration are correct, continue to Simple autonomous. Do not try to tune PID around an incorrect motor direction.'] }
    ]
  },
  {
    slug: 'simple-autonomous', title: 'Simple autonomous', shortTitle: 'Simple autonomous',
    summary: 'Drive a set distance, turn to a heading, and combine functions.',
    description: 'Write small movement functions that finish, report failure, and can be reused in a routine.',
    prerequisite: 'The shared main.cpp from Getting started, with correct motor directions.',
    sources: ['vexMotors', 'vexImu', 'prosMotors', 'prosTasks'],
    sections: [
      { id: 'distance', title: 'Convert wheel rotation to distance', paragraphs: [
        'One wheel revolution travels approximately its circumference. Convert the change in motor encoder position into wheel revolutions, then multiply by π times the wheel diameter. External gearing must be included: a motor that turns twice per wheel turn needs a motor-revolutions-per-wheel-revolution value of 2.',
        'The motor cartridge ratio is handled by the configured motor encoder. The separate ratio in this equation is the external transmission between the motor output shaft and wheel. Measure actual travel on the field; wheel compression and slipping still introduce error.'
      ], formula: 'distance = (motor degrees ÷ 360 ÷ external ratio) × π × wheel diameter', sources: ['vexMotors', 'prosMotors'] },
      { id: 'drive', title: 'Drive a set distance', paragraphs: [
        'Add this helper above autonomous(). It records the starting encoder readings instead of zeroing them, so another subsystem can continue tracking their position. Each side receives its own proportional correction.',
        'Positive inches move forward; negative inches reverse. The function returns true after both sides remain within 0.3 inches for about 100 ms. It returns false on timeout. The gain, tolerance, speed limit, and timeout are starting values you must test. This basic example controls wheel travel, not field heading.'
      ], code: snippets.drive, codeLabel: 'main.cpp · add driveDistance()', sources: ['vexMotors'] },
      { id: 'turn', title: 'Turn to a heading', paragraphs: [
        'A target of 90° means 90° clockwise from the calibrated heading, not an additional 90° turn. wrap180() selects the short signed error: from 359° to 1°, the error is +2°, not −358°.',
        'The robot must stay near the target before success is reported. A timeout prevents a stalled or misconfigured turn from blocking the rest of the program indefinitely. The PID guide adds damping and a velocity condition for more controlled settling.'
      ], code: snippets.turn, codeLabel: 'main.cpp · add turnToHeading()', sources: ['vexImu'] },
      { id: 'routine', title: 'Build a routine', paragraphs: [
        'Replace autonomous() with the sequence below. Each helper finishes before the next one starts. If a movement times out, return immediately rather than continuing from a position the robot may never have reached.',
        'This travels 24 inches forward, faces the 90° heading, then reverses 12 inches. Run each movement on its own first. A working sequence should not depend on the battery being at exactly the same voltage every time.'
      ], diagram: 'routine', code: snippets.sequence, codeLabel: 'main.cpp · replace autonomous()' },
      { id: 'mechanisms', title: 'Add an intake helper', paragraphs: [
        'Add this helper above autonomous(). It assumes an intake motor on Port 3. Call runIntake(50, 500) inside your routine to run at 50% for half a second, then stop.',
        'A blocking helper is easiest to understand. For simultaneous intake and driving, start the intake with spin(), run the drive helper, and stop the intake on every exit path. You do not need a new task just to keep a motor spinning.'
      ], code: snippets.mechanism, codeLabel: 'main.cpp · optional intake', sources: ['vexMotors', 'prosTasks'] },
      { id: 'testing', title: 'Test the functions', steps: [
        'Mark a starting line and command 12, 24, and 36 inches. Test reverse travel too.',
        'If every distance is wrong by a similar percentage, check wheel diameter and external gearing before changing the controller gain.',
        'Test headings near 0°/360° and turns in both directions. Verify a positive output turns clockwise.',
        'Test the failure path by setting a short timeout with wheels raised. Confirm both motors stop and the next movement does not run.'
      ] }
    ]
  },
  {
    slug: 'pid', title: 'PID control', shortTitle: 'PID control',
    summary: 'Calculate feedback, tune a controller, and handle settling.',
    description: 'Use a turn controller to learn proportional, integral, and derivative feedback.',
    prerequisite: 'The shared configuration and the heading convention from Simple autonomous.',
    sources: ['sigPid', 'lemPid', 'vexImu', 'vexMotors', 'prosMotors'],
    sections: [
      { id: 'error', title: 'Calculate the error', paragraphs: [
        'Error is the target minus the measurement. For a turn, both values are angles. Wrap the difference to −180°…180° before calculating the motor output. A proportional controller multiplies that error by kP.',
        'Large kP produces more output for the same error. Too little may leave the robot short of the target; too much can cause overshoot or oscillation. The sign is just as important: positive error must produce a turn that reduces that error.'
      ], formula: 'error = wrap180(target heading − measured heading)', sources: ['sigPid', 'vexImu'], diagram: 'pid' },
      { id: 'terms', title: 'P, I, and D', table: { headings: ['Term', 'Calculation', 'Purpose'], rows: [
        ['Proportional', 'kP × error', 'Apply output in proportion to current error.'],
        ['Integral', 'kI × Σ(error × dt)', 'Correct a persistent offset; can accumulate too much.'],
        ['Derivative', '−kD × measured angular rate', 'Damp motion as the robot approaches the target.']
      ] }, paragraphs: [
        'This implementation differentiates the measurement instead of the target error. For a fixed target it provides damping without a derivative kick when a new target is requested. The heading delta is wrapped before dividing by the measured timestep.',
        'Here dt is in seconds, angles are in degrees, and output is percent. kP therefore has units of percent/degree; kI is percent/(degree·second); kD is percent·second/degree. Gains from code that omits dt will not transfer directly.'
      ], sources: ['sigPid'] },
      { id: 'controller', title: 'A turn PID function', paragraphs: [
        'Add turnPid() above autonomous() in the shared main.cpp, then call it in place of turnToHeading(). The numeric gains are examples for testing, not recommended values for an unknown robot. Start with kI at zero.',
        'Output is capped at 40%. Integral is restricted to a small error region, cleared on a sign change, and only accumulated when it does not worsen output saturation. Success also requires low angular speed for 150 ms; a brief pass through the target is not enough.'
      ], code: snippets.pid, codeLabel: 'main.cpp · add turnPid()', sources: ['vexImu', 'vexMotors'] },
      { id: 'tuning', title: 'Tune the controller', steps: [
        'Keep kI and kD at zero. Use a low output limit and a repeatable 45° or 90° target.',
        'Increase kP gradually until the robot reaches the target promptly. If it repeatedly oscillates, reduce kP.',
        'Increase kD in small steps to reduce overshoot. Excessive D can amplify sensor noise or make motion sluggish.',
        'Only add kI if the robot consistently stops short after the P/D behavior is reasonable. Keep the integral clamp and conditional integration.',
        'Repeat short and long turns in both directions. Test with the robot’s normal mechanisms and battery conditions.'
      ], paragraphs: ['Record the target, final error, settling time, and whether the timeout was reached for each trial. Change one setting at a time. LemLib’s tuning guide is a useful comparison, but its gain values and exit-condition implementation are not the same as this function.'], sources: ['lemPid'] },
      { id: 'symptoms', title: 'Common problems', table: { headings: ['Observation', 'Check first'], rows: [
        ['Turns away from the target', 'Motor direction and heading sign.'],
        ['Jumps near 0°', 'Wrap the angular error and measured delta.'],
        ['Oscillates near the target', 'Reduce P or add damping; inspect mechanical backlash.'],
        ['Stops briefly, then accelerates again', 'Integral accumulation or too narrow a settling condition.'],
        ['Never finishes', 'Timeout, sensor calibration, and whether tolerances are achievable.']
      ] } },
      { id: 'drive-pid', title: 'Use PID for driving', paragraphs: [
        'The same feedback structure can use inches of drive error instead of degrees. Start with the encoder conversion in Simple autonomous, then compute error from the target distance and measured travel. Retune the gains because the units and dynamics have changed.',
        'Distance control and heading correction are separate jobs. A common extension computes a drive output from distance error and a turn correction from heading error, then mixes left = drive + turn and right = drive − turn. Normalize or cap the mixed commands so neither exceeds the allowed output.'
      ], sources: ['prosMotors'] }
    ]
  },
  {
    slug: 'odometry', title: 'Odometry', shortTitle: 'Odometry',
    summary: 'Track X, Y, and heading using encoders and an inertial sensor.',
    description: 'Convert sensor changes into an estimate of the robot’s position on the field.',
    prerequisite: 'A calibrated inertial sensor. The full example adds two unpowered tracking wheels.',
    sources: ['sigOdom', 'lemConfig', 'vexRotation', 'vexImu', 'prosTasks'],
    sections: [
      { id: 'coordinates', title: 'Choose a coordinate convention', paragraphs: [
        'In this guide, +X points right on the field drawing, +Y points up, and heading θ is counterclockwise from +X. Distances are inches and internal angles are radians. Robot-local forward follows its nose; local sideways is positive to the robot’s left.',
        'VEX inertial rotation is clockwise-positive by default. Negate its reading before converting to radians. This is intentionally different from the clockwise heading targets in the simple turn helpers. setPose() aligns the inertial reading with your chosen field orientation.'
      ], diagram: 'odom', sources: ['vexImu', 'sigOdom'] },
      { id: 'sensors', title: 'Choose the sensors', paragraphs: [
        'Drive motor encoders can provide a first estimate of forward travel, but wheel slip appears as movement even when the robot does not travel that far. Unpowered tracking wheels measure their own ground contact and can improve that estimate; they still need consistent contact and accurate dimensions.',
        'The example uses one forward rolling tracker and one sideways tracker, both with external rotation sensors. Use continuous position(), not angle(), so a complete wheel revolution is not lost at wraparound. Reverse each tracker as needed so pushing forward or left produces a positive reading.'
      ], sources: ['vexRotation', 'lemConfig'] },
      { id: 'mounting', title: 'Mount and wire the tracking wheels', paragraphs: [
        'Use two unpowered omni wheels: one rolls with forward travel, and the other rolls sideways. Each wheel needs its own rotation sensor. The example assumes a direct 1:1 connection between the wheel shaft and sensor, with both wheels the same diameter. Geared trackers or different wheel sizes need separate conversion factors.',
        'Support each shaft so the wheel spins freely without wobbling. Secure the sensor body so it cannot turn with the shaft. Keep both wheels in contact with the tiles throughout normal driving; a spring-loaded mount can help maintain contact. Check that a tracker does not lift when the intake or arm moves.',
        'Connect the forward tracker to Smart Port 7 and the sideways tracker to Port 8 for the example. Route cables away from gears and moving shafts. These are example ports; update the constructors if your wiring differs.'
      ], diagram: 'tracking', table: { headings: ['Part', 'Placement and check'], rows: [
        ['Forward tracker', 'Wheel rolls toward the nose and tail. Positive position change when the robot moves forward.'],
        ['Sideways tracker', 'Wheel rolls left and right. Positive position change when the robot moves left in this guide.'],
        ['Rotation sensors', 'Forward: Port 7. Sideways: Port 8. Change false to true in a sensor constructor if its sign is reversed.'],
        ['Inertial sensor', 'Port 5 in the shared configuration. Keep the robot still during calibration.']
      ] }, sources: ['vexRotation', 'lemConfig'] },
      { id: 'wheel-size', title: 'Check wheel diameter and distance scale', paragraphs: [
        'Start with the tracking-wheel diameter in inches, then test a measured straight movement on the field. The two-tracker example uses 2.75-inch wheels; replace trackingWheelDiameter with your wheel size. Do not use the drivetrain wheel diameter here.',
        'Mark the robot’s start and end positions, push it straight a measured 24 inches, and compare the tracker’s reported travel. Correct direction before adjusting scale. If it reports 23.5 inches over a measured 24 inches, multiply the current diameter by 24 / 23.5. Repeat over several trials before changing the value.',
        'Calibrate the forward and sideways trackers separately. If they need different effective diameters, give each tracker its own conversion. A large or inconsistent error is a reason to check wheel contact, shaft coupling, gearing, and measurement technique instead of hiding the error in a diameter value.'
      ], formula: 'corrected diameter = current diameter × measured distance ÷ reported distance', sources: ['vexRotation', 'lemConfig'] },
      { id: 'offsets', title: 'Account for tracking-wheel offsets', paragraphs: [
        'A tracker away from the robot’s turning center travels during an in-place rotation. That travel is not translation of the robot center. Measure the perpendicular offset from the turning center to each tracker’s measurement line.',
        'With this guide’s signs, a forward tracker on the left reads negative travel during a counterclockwise turn. Add leftOffset × dθ to remove that rotational component. A sideways tracker ahead of center reads positive travel, so subtract forwardOffset × dθ. The signed example offsets are 3 inches left and 2 inches forward; replace them with measurements.'
      ], formula: 'forward arc = Δforward + left offset × Δθ\nsideways arc = Δsideways − forward offset × Δθ', sources: ['sigOdom'] },
      { id: 'setup-check', title: 'Before running odometry', steps: [
        'Push the robot forward: only the forward tracker should show substantial travel. Push left: only the sideways tracker should show substantial travel.',
        'Change each rotation sensor’s reversed flag until forward travel and robot-left travel are positive. This guide’s sideways sign differs from LemLib’s documented robot-right convention.',
        'Record the perpendicular left/right offset of the forward tracker and the front/back offset of the sideways tracker. Use the signs explained above.',
        'Check that both trackers still touch the floor with the robot carrying its normal load.',
        'Run the stationary tracking test below before enabling drive commands. An in-place turn should change heading while leaving the estimated center nearly fixed.'
      ], sources: ['vexRotation', 'sigOdom'] },
      { id: 'implementation', title: 'Update the pose', paragraphs: [
        'Add these definitions above autonomous(). The update uses encoder differences, removes offset-induced rotation, converts local arcs into chords, and rotates them into the field frame using the midpoint heading. A small-angle limit avoids division by zero.',
        'This derivation assumes roughly constant curvature within one sample. Run updates frequently enough that one sample does not contain a large, complex motion. Treat the resulting pose as an estimate, not a measurement of absolute field position.'
      ], code: snippets.odom, codeLabel: 'main.cpp · two-tracker odometry', sources: ['sigOdom', 'vexRotation'] },
      { id: 'ownership', title: 'Run one pose update loop', paragraphs: [
        'Start with this stationary tracking test. It stops the motors, initializes a known pose, and prints updates for ten seconds while you move the robot by hand. Only this autonomous loop writes pose.',
        'To integrate motion helpers, call updateOdometry() inside each drive/turn loop. Do not also run a second odometry task. If you later introduce tasks, give pose a single owner and route reset requests through it, or protect all shared accesses with an appropriate synchronization mechanism. Declaring pose volatile is not a synchronization strategy.'
      ], code: snippets.odomLoop, codeLabel: 'main.cpp · replace autonomous() for tracking test', sources: ['prosTasks'] },
      { id: 'validation', title: 'Check for drift', steps: [
        'Push straight along a measured line. Check direction first, then distance scale.',
        'Push sideways. Confirm the side tracker increases for robot-left motion.',
        'Rotate about the tracking center without translating. X and Y should remain nearly fixed. A curved position trace usually points to offset signs, offset magnitudes, wheel lift, or heading scale.',
        'Drive or push a square and compare the ending pose to the starting mark. Test on the actual field surface.',
        'Check that setPose() refreshes the previous sensor samples. Otherwise the next update can reapply movement from before the reset.'
      ], sources: ['lemConfig'] }
    ]
  },
  {
    slug: 'wall-resets', title: 'Distance sensor wall resets', shortTitle: 'Wall resets',
    summary: 'Correct a pose coordinate using a distance reading from a known wall.',
    description: 'Use known field geometry to correct accumulated position error when the sensor has a clear view of a wall.',
    prerequisite: 'The odometry pose convention and update loop, plus a front-facing V5 Distance Sensor.',
    sources: ['vexRange', 'sigOdom', 'prosTasks'],
    sections: [
      { id: 'measurement', title: 'What a wall reading tells you', paragraphs: [
        'A distance sensor reports the nearest detected object along its viewing direction. It does not know whether that object is the intended wall. A game object or another robot can produce a plausible reading, so choose reset locations with a clear line of sight.',
        'A vertical wall constrains X; a horizontal wall constrains Y. One reading does not determine X, Y, and heading together. This example keeps the odometry heading and corrects only X using a known east wall.'
      ], diagram: 'wall', sources: ['vexRange'] },
      { id: 'geometry', title: 'Include sensor position and heading', paragraphs: [
        'Measure the sensor’s position relative to the tracking center, not the bumper. A sensor 5 inches forward of center is already 5 inches closer to a wall when the robot faces it. At an angle, both the mounting offset and the measured range must be projected into field coordinates.',
        'Let f be the sensor’s forward offset, l its left offset, d the range in inches, and θ the counterclockwise robot heading. For a forward-facing sensor and a vertical wall at x = W, the equations below give the center’s X. If the sensor is angled relative to the robot, use its ray angle θ + mounting angle for the range projection.'
      ], formula: 'sensor offset X = f cos(θ) − l sin(θ)\nrobot X = W − sensor offset X − d cos(θ)', sources: ['sigOdom'] },
      { id: 'reset', title: 'Reset X from the east wall', paragraphs: [
        'Add this to the odometry example. Call it from the same task that owns pose, while stationary, immediately after updateOdometry(). Supply the measured inner wall X coordinate; do not assume a nominal field width matches the measurement surface.',
        'The example accepts headings within 10° of +X, a conservative 50–1,500 mm range, and a maximum 6-inch pose correction. Those are example gates to tune. VEX lists a wider 20–2,000 mm operating range; choosing a narrower range here does not change the sensor’s specification.'
      ], code: snippets.reset, codeLabel: 'main.cpp · add resetXFromEastWall()', sources: ['vexRange'] },
      { id: 'filter', title: 'Reject bad resets', steps: [
        'First confirm that the ray reaches the intended wall without crossing a game object. Numeric gates alone cannot identify the wall.',
        'Take several readings while stationary, reject invalid samples, and compare their spread before using a median. A stable obstacle can still pass this test.',
        'Reject readings outside your tested range and geometry. A ray nearly parallel to a wall is a poor constraint.',
        'Compare the candidate coordinate with the current pose. Treat a large discrepancy as a reason to investigate rather than automatically jumping the pose.',
        'Log raw range, heading, candidate coordinate, and acceptance reason. Keep a rejected reading from changing pose.'
      ] },
      { id: 'other-walls', title: 'Use another wall', paragraphs: [
        'The general vertical-wall equation is x = wallX − offsetX − d × rayX. The general horizontal-wall equation is y = wallY − offsetY − d × rayY. Ray components carry their signs, so the same equation can describe the opposite wall when the ray points toward it.',
        'For a forward-facing sensor, rayX = cos θ and rayY = sin θ. The sensor’s field Y offset is f sin θ + l cos θ. Validate the direction toward the selected wall and that the intersection lies on the actual wall segment, not an extension past a corner.'
      ], formula: 'vertical wall: x = wall X − offset X − range × ray X\nhorizontal wall: y = wall Y − offset Y − range × ray Y' },
      { id: 'after-reset', title: 'Continue tracking after a reset', paragraphs: [
        'Correcting pose.x does not require resetting encoder positions or inertial rotation. Keep the odometry baselines from the latest update so the next sample adds only new travel. A positional wall correction does not change headingOffset.',
        'Apply the correction inside the pose-owning loop. If another task requests a reset, pass a request to that loop instead of writing pose directly. Test by resetting while stationary, taking another update, and confirming there is no second jump.'
      ], sources: ['prosTasks'] }
    ]
  }
];

const readingOrder = ['getting-started', 'cpp-basics', 'sensors', 'simple-autonomous', 'mechanisms', 'color-sorting', 'pid', 'odometry', 'drive-to-point', 'wall-resets', 'debugging'];
const bySlug = new Map([...coreGuides, ...extraGuides, colorSorting].map(guide => [guide.slug, guide]));
export const guides = readingOrder.map(slug => bySlug.get(slug));

