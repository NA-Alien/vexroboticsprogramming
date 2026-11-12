export const guideGroups = [
  { id: 'basics', title: 'Basics', description: 'Project setup, C++, and robot hardware.', slugs: ['getting-started', 'cpp-basics', 'sensors', 'mechanisms', 'color-sorting'] },
  { id: 'autonomous', title: 'Autonomous', description: 'Movement functions, feedback, and testing.', slugs: ['simple-autonomous', 'pid', 'debugging'] },
  { id: 'position', title: 'Position tracking', description: 'Odometry, coordinate targets, and field measurements.', slugs: ['odometry', 'drive-to-point', 'wall-resets'] }
];

export const relatedGuideSlugs = {
  'getting-started': ['cpp-basics', 'simple-autonomous'],
  'cpp-basics': ['sensors', 'mechanisms'],
  sensors: ['color-sorting', 'odometry'],
  'simple-autonomous': ['pid', 'mechanisms'],
  mechanisms: ['color-sorting', 'debugging'],
  'color-sorting': ['sensors', 'mechanisms'],
  pid: ['simple-autonomous', 'debugging'],
  odometry: ['drive-to-point', 'wall-resets'],
  'drive-to-point': ['odometry', 'pid'],
  'wall-resets': ['odometry', 'sensors'],
  debugging: ['sensors', 'pid']
};

export const functionLinks = [
  { name: 'driveDistance()', slug: 'simple-autonomous', section: 'drive', description: 'Encoder distance' },
  { name: 'turnToHeading()', slug: 'simple-autonomous', section: 'turn', description: 'Absolute heading' },
  { name: 'turnPid()', slug: 'pid', section: 'controller', description: 'PID turn controller' },
  { name: 'setPose()', slug: 'odometry', section: 'implementation', description: 'Initialize X, Y, and heading' },
  { name: 'driveToPoint()', slug: 'drive-to-point', section: 'controller', description: 'Approach an X/Y target' },
  { name: 'resetXFromEastWall()', slug: 'wall-resets', section: 'reset', description: 'Correct the X coordinate' }
];

