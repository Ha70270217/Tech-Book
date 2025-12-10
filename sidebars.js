/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  textbook: [
    {
      type: 'category',
      label: 'Chapter 1: Introduction to Physical AI',
      collapsed: false,
      items: [
        'chapter-1/index',
        'chapter-1/key-concepts',
        'chapter-1/examples',
        'chapter-1/exercises',
        'chapter-1/references'
      ],
    },
    {
      type: 'category',
      label: 'Chapter 2: Basics of Humanoid Robotics',
      items: [
        'chapter-2/index',
        'chapter-2/key-concepts',
        'chapter-2/examples',
        'chapter-2/exercises',
        'chapter-2/references'
      ],
    },
    {
      type: 'category',
      label: 'Chapter 3: ROS 2 Fundamentals',
      items: [
        'chapter-3/index',
        'chapter-3/key-concepts',
        'chapter-3/examples',
        'chapter-3/exercises',
        'chapter-3/references'
      ],
    },
    {
      type: 'category',
      label: 'Chapter 4: Digital Twin Simulation (Gazebo + Isaac)',
      items: [
        'chapter-4/index',
        'chapter-4/key-concepts',
        'chapter-4/examples',
        'chapter-4/exercises',
        'chapter-4/references'
      ],
    },
    {
      type: 'category',
      label: 'Chapter 5: Vision-Language-Action Systems',
      items: [
        'chapter-5/index',
        'chapter-5/key-concepts',
        'chapter-5/examples',
        'chapter-5/exercises',
        'chapter-5/references'
      ],
    },
    {
      type: 'category',
      label: 'Chapter 6: Capstone: Simple AI-Robot Pipeline',
      items: [
        'chapter-6/index',
        'chapter-6/key-concepts',
        'chapter-6/examples',
        'chapter-6/exercises',
        'chapter-6/references'
      ],
    },
  ],
};

module.exports = sidebars;