'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('ServiceSteps', [
      {
        service_id: 2,
        name: 'Initial Consultation',
        description: 'Discuss business goals, branding, and website purpose.',
        duration_days: 1,
        amount: 0,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        service_id: 2,
        name: 'Content Collection',
        description: 'Collect images, text, and assets from the client.',
        duration_days: 2,
        amount: 0,
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        service_id: 2,
        name: 'Design Mockups',
        description: 'Create homepage and inner page UI mockups for approval.',
        duration_days: 3,
        amount: 0,
        order: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        service_id: 2,
        name: 'Website Development',
        description: 'Code the website using HTML, CSS, JS, and backend (if needed).',
        duration_days: 5,
        amount: 0,
        order: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        service_id: 2,
        name: 'Mobile Responsiveness',
        description: 'Ensure the website works well on mobile and tablet devices.',
        duration_days: 2,
        amount: 0,
        order: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        service_id: 2,
        name: 'SEO Optimization',
        description: 'Add basic SEO tags, meta descriptions, and site speed improvements.',
        duration_days: 1,
        amount: 0,
        order: 6,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        service_id: 2,
        name: 'Testing & Feedback',
        description: 'Client reviews the site, and we make requested revisions.',
        duration_days: 2,
        amount: 0,
        order: 7,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        service_id: 2,
        name: 'Final Deployment',
        description: 'Deploy to live server and ensure everything runs smoothly.',
        duration_days: 1,
        amount: 0,
        order: 8,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        service_id: 2,
        name: 'Post-launch Support',
        description: '1-week support to fix any bugs or make minor changes.',
        duration_days: 7,
        amount: 0,
        order: 9,
        createdAt: new Date(),
        updatedAt: new Date()
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('ServiceSteps', { service_id: 2 }, {});
  }
};
