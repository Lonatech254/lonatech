const { Service, Category, ServiceStep, Sample, Requirement, Review } = require('../models');

exports.addService = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      priceUnit,
      categoryId,
      requirements = [],
      order,
      steps = [],
      samples = [],
    } = req.body;
    // Validate category
    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Create the service
    const newService = await Service.create({
      name,
      description,
      price,
      priceUnit,
      order,
      categoryId,
    });

    // Add associated service steps
    const serviceSteps = steps.map((step) => ({
      ...step,
      service_id: newService.id,
    }));
    if (serviceSteps.length) {
      await ServiceStep.bulkCreate(serviceSteps);
    }

    // Add associated samples
    const serviceSamples = samples.map((sample) => ({
      ...sample,
      service_id: newService.id,
    }));
    if (serviceSamples.length) {
      await Sample.bulkCreate(serviceSamples);
    }

    // Add associated requirements
    const serviceRequirements = requirements.map((req) => ({
      ...req,
      service_id: newService.id,
    }));
    if (serviceRequirements.length) {
      await Requirement.bulkCreate(serviceRequirements);
    }

    res.status(201).json({
      message: 'Service created successfully',
      service: newService,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Failed to create service',
      error: error.message,
    });
  }
};

exports.getServiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name'], // Include only necessary fields
        },
        {
          model: ServiceStep,
          as: 'steps', // Make sure you defined the alias in your associations
          order: [['order', 'ASC']],
        },
        {
          model: Sample,
          as: 'samples',
        },
        {
          model: Requirement,
          as: 'requirements',
        },
        {
          model: Review,
          as: 'reviews',
        }
      ]
    });

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    res.status(200).json({ service });
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({
      message: 'Failed to fetch service',
      error: error.message,
    });
  }
};
