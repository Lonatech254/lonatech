const { Order, User, OrderStep, Service, Category, ServiceStep, Sample, Requirement, Payment } = require('../models');
const { Op } = require('sequelize');

const payOrder = require('../pay')
// Create a new order
exports.createOrder = async (req, res) => {
    try {

        const data = await req.userData;
        const userId = data.userId;
        const serviceId = parseInt(req.body.serviceId);

        let order = await Order.findOne({
  where: {
    userId,
    serviceId,
    status: { [Op.not]: 'completed' } // Requires Sequelize's Op
  }
});

if (!order) {

    order = await Order.create({ serviceId, userId });

        const service = await Service.findByPk(serviceId, {
            attributes: ['id'], // Include only necessary fields
            include: [
                {
                    model: ServiceStep,
                    as: 'steps', // Make sure you defined the alias in your associations
                    attributes: ['id'], // Include only necessary fields
                    order: [['order', 'ASC']],
                },
            ]
        });

        const ordersteps = service.steps.map(step => {
            return {
                order_id: order.id,
                service_step_id: step.id,
            }
        });

        if (ordersteps.length) {
            await OrderStep.bulkCreate(ordersteps);
        }
}
        if(req.headers.contentType === 'application/json'){
            res.json({id: order.id});
        }
        
        res.redirect(`/order?id=${order.id}`);

        //res.sendFile(`order.html?id=${order.id}`, { root: __dirname + '/../public' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.createPayment = async (req, res) => {
    try {
        const data = await req.userData;
        const userId = data.userId;
        let { orderId, stepId, amount, method } = req.body;

        let status = '';

        if (stepId && !amount) {
            const orderStep = await OrderStep.findByPk(stepId, {
                include: [
                    {
                        model: ServiceStep,
                        as: 'step'
                    },
                    {
                        model: Payment,
                        as: 'payment'
                    }
                ]
            });

            if (!orderStep) return res.status(404).json({ error: 'Order step not found' });

            const stepAmount = parseFloat(orderStep.step.amount || 0);
            const alreadyPaid = (orderStep.payment || []).reduce((sum, p) => sum + parseFloat(p.amount), 0);
            const stepBalance = stepAmount - alreadyPaid;

            if (stepBalance <= 0) {
                return res.status(400).json({ error: 'This step is already fully paid.' });
            }

            // Pay for the step
            status = await payOrder(stepBalance, orderId, userId);

            await Payment.create({
                orderId,
                stepId,
                amount: stepBalance,
                method,
                status
            });

        } else {
            const order = await Order.findByPk(orderId, {
                include: [
                    {
                        model: Service,
                        as: 'service',
                    },
                    {
                        model: Payment,
                        as: 'payment'
                    },
                    {
                        model: OrderStep,
                        as: 'steps',
                        include: [
                            {
                                model: ServiceStep,
                                as: 'step'
                            },
                            {
                                model: Payment,
                                as: 'payment'
                            }
                        ]
                    }
                ]
            });

            if (!order) return res.status(404).json({ error: 'Order not found' });

            if (!amount) {
                const totalPaid = (order.payment || []).reduce((sum, p) => sum + parseFloat(p.amount), 0);
                // You need to include service model in order to use order.service.price
                const servicePrice = parseFloat(order.service?.price || 0);
                amount = servicePrice - totalPaid;
            }

            status = await payOrder(amount, orderId, userId);

            let remainingAmount = amount;

            for (const step of order.steps) {
                const stepAmount = parseFloat(step.step?.amount || 0);
                const paid = (step.payment || []).reduce((sum, p) => sum + parseFloat(p.amount), 0);
                const stepBalance = stepAmount - paid;

                if (stepBalance <= 0 || remainingAmount <= 0) continue;

                const payThisStep = Math.min(stepBalance, remainingAmount);

                await Payment.create({
                    orderId,
                    stepId: step.id,
                    amount: payThisStep,
                    method,
                    status
                });

                remainingAmount -= payThisStep;
            }
        }

        return res.json({ message: 'success' });
    } catch (err) {
        console.error(err);
        return res.status(400).json({ error: err.message });
    }
};

// Get all orders
exports.getOrders = async (req, res) => {
    try {
        const orders = await Order.findAll();
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get a single order by ID
exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id, {
            include: [
                { model: Service, as: 'service' },
                { model: User, as: 'user' },
                { model: Payment, as: 'payment' },
                {
                    model: OrderStep,
                    as: 'steps',
                    include: [
                        { model: ServiceStep, as: 'step' },
                        { model: Payment, as: 'payment' }
                    ]
                }
            ]
        });

        if (!order) return res.status(404).json({ error: 'Order not found' });

        // Calculate order balance
        const servicePrice = parseFloat(order.service?.price || 0);
        const totalPaid = (order.payment || []).reduce((sum, p) => sum + parseFloat(p.amount), 0);
        const balance = servicePrice - totalPaid;

        // Calculate each step balance
        const orderSteps = (order.steps || []).map(step => {
            const stepAmount = parseFloat(step.step?.amount || 0);
            const stepPaid = (step.payment || []).reduce((sum, p) => sum + parseFloat(p.amount), 0);
            const stepBalance = stepAmount - stepPaid;

            return {
                id: step.id,
                name: step.step?.name,
                description: step.step?.description,
                duration_days: step.step?.duration_days,
                amount: `${stepAmount} ${order.service.priceUnit}`,
                balance: `${stepBalance} ${order.service.priceUnit}`,
                status: step.status,
                start_date: step.start_date,
                end_date: step.end_date,
                progress: step.progress || 0
            };
        });

        const orderData = {
            id: order.id,
            status: order.status,
            note: order.note, // Fixed: use order.note instead of status
            placedAt: order.createdAt,
            service: order.service?.name,
            serviceId: order.serviceId,
            price: `${servicePrice} ${order.service.priceUnit}`,
            balance: `${balance} ${order.service.priceUnit}`,
            user: `${order.user?.first_name} ${order.user?.last_name}`,
            phone: order.user?.phone,
            profile_picture: order.user?.profile_pic,
            email: order.user?.email,
            userId: order.userId,
            steps: orderSteps
        };

        res.json(orderData);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};


// Update an Order Step by ID
exports.updateOrder = async (req, res) => {
    try {
        const { start_date, stepId, status, end_date, progress } = req.body;

        if (!stepId) {
            return res.status(400).json({ error: 'stepId is required' });
        }

        const updateData = {};
        if (start_date) updateData.start_date = start_date;
        if (status) {
            updateData.status = status;
            if (status === 'in_progress') {
                updateData.progress = progress;
            } else if (status === 'completed') {
                updateData.progress = 100;
            } else {
                updateData.progress = 0;
            }
        }
        if (end_date) updateData.end_date = end_date;

        console.log(updateData);
        const [updated] = await OrderStep.update(updateData, {
            where: { id: parseInt(stepId) }
        });

        if (updated === 0) {
            return res.status(404).json({ error: 'Order Step not found or no changes made' });
        }

        const updatedOrderStep = await OrderStep.findByPk(stepId);
        res.json(updatedOrderStep);

    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.payment = async (req, res) => {

    if (req.query.stepId) {
        const step = await OrderStep.findByPk(req.query.stepId, {
            include: [
                {
                    model: Order,
                    as: 'order',
                    include: [
                        {
                            model: User,
                            as: 'user',
                            //attributes: ['name', ]

                        },
                        {
                            model: Service,
                            as: 'service'
                        }
                    ]
                },
                { model: ServiceStep, as: 'step' },
                { model: Payment, as: 'payment' }
            ]
        });

        const stepAmount = parseFloat(step.step?.amount || 0);
        const stepPaid = (step.payment || []).reduce((sum, p) => sum + parseFloat(p.amount), 0);
        const stepBalance = stepAmount - stepPaid;

        const stepData = {
            id: step.id,
            name: step.step?.name,
            description: step.step?.description,
            duration_days: step.step?.duration_days,
            amount: `${stepAmount} ${step.order.service.priceUnit}`,
            balance: `${stepBalance} ${step.order.service.priceUnit}`,
            placedAt: step.order.createdAt,
            service: step.order.service?.name,
            serviceId: step.order.serviceId,
            user: `${step.order.user?.first_name} ${step.order.user?.last_name}`,
            phone: step.order.user?.phone,
            profile_picture: step.order.user?.profile_pic,
            email: step.order.user?.email,
            userId: step.order.userId,
        };


        console.log(stepData);

    } else if (req.query.orderId) {

        const order = await Order.findByPk(req.query.orderId, {
            include: [
                { model: Service, as: 'service' },
                { model: User, as: 'user' },
                { model: Payment, as: 'payment' },
            ]
        });
        // Calculate order balance
        const servicePrice = parseFloat(order.service?.price || 0);
        const totalPaid = (order.payment || []).reduce((sum, p) => sum + parseFloat(p.amount), 0);
        const balance = servicePrice - totalPaid;

        const orderData = {
            id: order.id,
            status: order.status,
            note: order.note, // Fixed: use order.note instead of status
            placedAt: order.createdAt,
            service: order.service?.name,
            serviceId: order.serviceId,
            price: `${servicePrice} ${order.service.priceUnit}`,
            balance: `${balance} ${order.service.priceUnit}`,
            user: `${order.user?.first_name} ${order.user?.last_name}`,
            phone: order.user?.phone,
            profile_picture: order.user?.profile_pic,
            email: order.user?.email,
            userId: order.userId,
        };

        console.log(orderData);
    }

}

exports.finished = async (req, res) => {

    if (req.query.orderId) {

        const order = await Order.findByPk(req.query.orderId, {
            include: [
                { model: Service, as: 'service' },
                { model: User, as: 'user' },
                { model: Payment, as: 'payment' },
            ]
        });
        // Calculate order balance
        const servicePrice = parseFloat(order.service?.price || 0);
        const totalPaid = (order.payment || []).reduce((sum, p) => sum + parseFloat(p.amount), 0);
        const balance = servicePrice - totalPaid;

        const orderData = {
            id: order.id,
            status: order.status,
            note: order.note, // Fixed: use order.note instead of status
            placedAt: order.createdAt,
            service: order.service?.name,
            serviceId: order.serviceId,
            price: `${servicePrice} ${order.service.priceUnit}`,
            balance: `${balance} ${order.service.priceUnit}`,
            user: `${order.user?.first_name} ${order.user?.last_name}`,
            phone: order.user?.phone,
            profile_picture: order.user?.profile_pic,
            email: order.user?.email,
            userId: order.userId,
        };

        console.log(orderData);
    }
}


// Delete an order by ID
exports.deleteOrder = async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);
        if (!order) return res.status(404).json({ error: 'Order not found' });
        res.json({ message: 'Order deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};