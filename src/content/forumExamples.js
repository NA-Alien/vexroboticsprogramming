export const exampleThreads = [
  {
    id: 'example-pid', guide_slug: 'pid', title: 'My 90° turn overshoots, then stops short',
    author_name: 'Example team', solution_id: 'example-pid-reply',
    body: 'The first pass hits 98°, then the robot comes back to 87°. I logged heading every 20 ms. Should I add integral or change damping first?',
    code: 'turnPid(90.0);',
    replies: [{
      id: 'example-pid-reply', author_name: 'Example reply',
      body: 'Start with integral at zero. A crossing followed by a correction back is overshoot. Compare two runs at the same speed limit with a small change to damping. Log peak heading and the time spent within the settling tolerance.',
    }],
  },
  {
    id: 'example-odometry', guide_slug: 'odometry', title: 'Why does my pose move during an in-place turn?',
    author_name: 'Example team',
    body: 'A straight 48-inch test reads correctly. After a 90° turn the pose moves sideways about three inches. The tracker sits two inches away from the turn center.',
    replies: [{
      id: 'example-odometry-reply', author_name: 'Example reply',
      body: 'Two inches times π/2 radians gives about 3.14 inches of raw tracker movement. Compare the raw reading before and after a turn in each direction and check whether your offset term cancels the motion or doubles it.',
    }],
  },
];
