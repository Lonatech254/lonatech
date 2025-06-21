const { Op } = require('sequelize');
const {
  Task,
  ServiceProvider,
  User,
  Service,
  Order,
  Request,
  Notification,
} = require('../models');

exports.asignTasks = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { status: 'pending' },
      include: [
        { model: Task, as: 'task' },
        { model: Service, as: 'service' },
      ],
    });

    const services = [];
    const unassigned = orders.filter((o) => !o.task);

    for (const order of unassigned) {
      const requests = await Request.findAll({
        where: { orderId: order.id },
      });

      // Case 1: No requests exist yet — notify providers
      if (!requests || requests.length === 0) {
        await notifyAvailableProviders(order);
        continue;
      }

      let assigned = false;
      let alreadyRejectedIds = [];

      while (!assigned) {
        // Fetch best next available provider (excluding those already rejected)
        const service_provider = await ServiceProvider.findOne({
          where: {
            serviceId: order.serviceId,
            available: true,
            id: { [Op.notIn]: alreadyRejectedIds },
          },
          include: [
            {
              model: Request,
              as: 'requests',
              where: {
                status: 'in-review',
                orderId: order.id,
              },
              required: true,
            },
            {
              model: Task,
              as: 'tasks',
            },
          ],
          order: [['service_score', 'DESC']],
        });

        // If no more providers, re-notify everyone again
        if (!service_provider) {
          await notifyAvailableProviders(order);
          break;
        }

        const hasPendingTasks = service_provider.tasks.some(
          (t) => t.status !== 'completed'
        );

        const requestToUpdate = service_provider.requests[0];

        if (!requestToUpdate) {
          alreadyRejectedIds.push(service_provider.id);
          continue;
        }

        if (hasPendingTasks) {
          // Reject and try next
          await Request.update(
            {
              status: 'rejected',
              note: 'Please complete your previous task before applying again.',
            },
            {
              where: { id: requestToUpdate.id },
            }
          );

          alreadyRejectedIds.push(service_provider.id);
        } else {
          // Accept this one
          await Request.update(
            {
              status: 'accepted',
              note: 'Please accept the task in the next 24 hours.',
            },
            {
              where: { id: requestToUpdate.id },
            }
          );

          services.push({
            orderId: order.id,
            assignedTo: service_provider.userId,
            accepted: true,
          });

          assigned = true;
        }
      }
    }

    res.json({ success: true, assigned: services });
  } catch (err) {
    console.error('Error assigning tasks:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

// 🔁 Helper function to notify all available providers for the service
async function notifyAvailableProviders(order) {
  const service_providers = await ServiceProvider.findAll({
    where: { serviceId: order.serviceId, available: true },
  });

  const notifications = service_providers.map((sp) => ({
    user_id: sp.userId,
    title: 'New Task Posted',
    message: `${order.service.name} task posted. Go to tasks and apply. Ensure you have a good score to increase your chance of getting the task.`,
  }));

  if (notifications.length > 0) {
    await Notification.bulkCreate(notifications);
  }
}


exports.getTasks = async (req, res) => {
    const orders = await Order.findAll({
        where: { status: req.params.status },
        include: {
            model: Task,
            as: 'task'
        }
    });


    res.json(orders);
}