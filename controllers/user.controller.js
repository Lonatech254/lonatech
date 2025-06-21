const models = require('../models');
const bcrypt = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv').config();
const config = require('../config/config');
const cookieParser = require('cookie-parser');
const Datastore = require('nedb-promises');
const { where } = require('sequelize');
const { Op } = require('sequelize');


const userRefreshTokens = Datastore.create('UserRefreshTokens.db')
const userInvalidTokens = Datastore.create('UserInvalidTokens.db')

async function getUser(req, res) {
    const data = await req.userData;
    if (data) {
        return res.status(409).json({ id: data.userId });
    }
}

async function signUp(req, res, next) {
    console.log(req.body);
    const data = await req.userData;

    if (data) {
        return res.status(409).json({
            message: "Another user is still logged in"
        });

    } else {

        const user = await models.User.findOne({ where: { email: req.body.email } });

        if (user) return res.status(409).json({ message: "The email already exists" });


        bcrypt.hash(req.body.password, bcrypt.genSaltSync(10), null, (err, hash) => {
            console.log(err)
            if (err) {
                return res.status(500).json({
                    error: err
                });
            } else {

                models.User.findAll().then(users => {

                    let user = {
                        phone: req.body.phone,
                        first_name: req.body.first_name,
                        last_name: req.body.last_name,
                        email: req.body.email,
                        password: hash,
                        profile_pic: 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png?20170328184010',
                        role: "admin"
                    };

                    if (users.length > 0) {
                        user = {
                            phone: req.body.phone,
                            first_name: req.body.first_name,
                            last_name: req.body.last_name,
                            email: req.body.email,
                            password: hash,
                            profile_pic: 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png?20170328184010',
                            role: "client"
                        };
                    }

                    models.User.create(user).then(result => {

                        if (result) {
                            const accessToken = jwt.sign({ userId: result.id }, config.accessTokenSecret, { subject: 'accessApi', expiresIn: config.accessTokenExpiresIn })

                            const refreshToken = jwt.sign({ userId: result.id }, config.refreshTokenSecret, { subject: 'refreshToken', expiresIn: config.refreshTokenExpiresIn })

                            userRefreshTokens.insert({
                                refreshToken,
                                userId: user.id
                            })
                            req.accessToken = accessToken;
                            req.refreshToken = refreshToken;
                            next();
                        } else {
                            return res.status(401).json({
                                message: 'Registration Failed!!',
                            });
                        }
                    }).catch(error => {
                        console.log(error);
                        res.status(500).json({
                            message: 'Something Went Wrong',
                            error: error
                        });
                    });
                }).catch(error => {
                    console.error("Error retrieving equipments:", error);
                    res.status(500).json({ message: "Error retrieving equipments", error: error.message });
                });
            }
        });
    }

}


async function login(req, res, next) {
    const data = await req.userData;
    if (data) {
        return res.status(409).json({
            message: "Another user is still logged in"
        });

    } else {
        models.User.findOne({ where: { email: req.body.email }, limit: 1 }).then(user => {
            if (user) {
                bcrypt.compare(req.body.password, user.password, (err, result) => {
                    console.log(err, result);
                    if (result) {
                        const accessToken = jwt.sign({ userId: user.id }, config.accessTokenSecret, { subject: 'accessApi', expiresIn: config.accessTokenExpiresIn })

                        const refreshToken = jwt.sign({ userId: user.id }, config.refreshTokenSecret, { subject: 'refreshToken', expiresIn: config.refreshTokenExpiresIn })

                        userRefreshTokens.insert({
                            refreshToken,
                            userId: user.id
                        })
                        req.accessToken = accessToken;
                        req.refreshToken = refreshToken;
                        next();
                    } else {
                        return res.status(401).json({
                            message: 'Incorrect Password!!',
                        });
                    }
                })
            } else {
                res.status(401).json({
                    message: 'User doesn\'t exist!!',
                });
            }
        }).catch(err => {
            res.status(500).json({
                message: 'Something Went Wrong',
                error: err
            });
        });
    }
}

async function logout(req, res) {
    const data = await req.userData;
    if (data) {
        try {
            await userRefreshTokens.removeMany({ userId: data.userId })
            await userRefreshTokens.compactDatafile()

            await userInvalidTokens.insert({
                accessToken: req.accessToken.value,
                userId: req.userData.userId,
                expirationTime: req.accessToken.exp
            })
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');
            res.status(200).json({ message: "Logged out successfully" });
        } catch (error) {
            return res.status(500).json({ message: error.message })
        }
    } else {
        return res.status(401).json({ message: "No user logged in" });


    }
}

async function findUser(req, res) {    
    const id = req.params.id;
    const currentUser = await req.userData;
    const currentUserId = parseInt(currentUser?.userId);
    const page = parseInt(req.query.page) || 1;
    const limit = 30;
    const offset = (page - 1) * limit;
const totalOrders = await models.Order.count({
  where: { userId: id },
});
    models.User.findByPk(id, {
            include: [
                {
                    model: models.Order, as: 'orders',
                    limit,
                    offset,
                },
            ],
        }).then(result => {
        if (result) {
            res.status(200).json({
                id: result.id,
                phone: result.phone,
                full_name: `${result.first_name} ${result.last_name}`,
                email: result.email,
                profile_picture: result.profile_pic,
                bio: result.bio,
                    orders: result.orders,
                    totalOrders
            });
        } else {
            res.status(404).json({
                message: "User not found!"
            })
        }
    }).catch(error => {
        res.status(500).json({
            message: "Something went wrong!"
        })
    });
}

async function show(req, res) {
    const data = await req.userData;
    const page = parseInt(req.query.page) || 1;
    const limit = 30;
    const offset = (page - 1) * limit;
    if (data) {
        const id = data.userId;

const totalOrders = await models.Order.count({
  where: { userId: id },
});
        models.User.findByPk(id, {
            include: [
                {
                    model: models.Order, as: 'orders',
                    limit,
                    offset,            
                    include: [
                { model: models.Service, as: 'service' },
            ]
                },
            ],
        }).then(result => {
            if (result) {
                res.status(200).json({
                    id: result.id,
                    phone: result.phone,
                    full_name: `${result.first_name} ${result.last_name}`,
                    email: result.email,
                    profile_picture: result.profile_pic,
                    bio: result.bio,
                    orders: result.orders,
                    totalOrders
                });
            } else {
                res.status(200).json({
                    message: "User not found!"
                })
            }
        }).catch(error => {
            res.status(200).json({
                message: "Something went wrong!"
            })
        });
    }
}


async function all(req, res) {
    const page = parseInt(req.query.page) || 1;    
    const q = req.query.search || '';
    const limit = 30;
    const offset = (page - 1) * limit;
    
    const currentUser = await req.userData;
    const currentUserId = parseInt(currentUser?.userId);
    models.User.findAll({
  where: {
    [Op.or]: [
      { phone: { [Op.like]: `%${q}%` } },
      { first_name: { [Op.like]: `%${q}%` } },
      { last_name: { [Op.like]: `%${q}%` } },
      { email: { [Op.like]: `%${q}%` } }
    ]
  },        limit,
        offset,
        order: [['createdAt', 'DESC']],
                    include: [],
    }).then(result => {
        const filteredResult = result.filter(user => parseInt(user.id) !== parseInt(currentUserId));

        const allUsers = filteredResult.map(user => {

            return {
                id: user.id,
                phone: user.phone,
                email: user.email,
                profile_picture: user.profile_pic || 'https://i.pinimg.com/736x/cd/4b/d9/cd4bd9b0ea2807611ba3a67c331bff0b.jpg',
            };
        });
        res.status(200).json({
            message: 'Users retrieved successfully',
            users: allUsers,
            pagination: {
                page,
                limit,
                total: allUsers.length,
            },
        });
    }).catch(error => {
        res.status(500).json({
            message: "Something went wrong!"
        })
    });
}

function team(req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = 30;
    const offset = (page - 1) * limit;

    models.User.findAll({
        where: {
            role: {
                [Op.ne]: 'client' || 'attachee' || 'intern' // Exclude regular users and writers
            }
        },
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        include: [],
    }).then(result => {
        let allUsers = result.map(user => ({
            id: user.id,
            phone: user.phone,
            full_name: `${user.first_name} ${user.last_name}`,
            email: user.email,
            profile_picture: user.profile_pic,
            role: user.role
        }));

        res.status(200).json({
            message: 'Users retrieved successfully',
            users: allUsers,
            pagination: {
                page,
                limit,
                total: allUsers.length,
            },
        });
    }).catch(error => {
        console.error(error);
        res.status(500).json({
            message: "Something went wrong!"
        });
    });
}

async function update(req, res) {
    const data = await req.userData;

    if (data) {
        const id = data.userId;

        const user = {};

        // Add fields only if they are not null or undefined
        if (req.body.phone != null) user.phone = req.body.phone;
        if (req.body.first_name != null) user.first_name = req.body.first_name;
        if (req.body.second_name != null) user.second_name = req.body.second_name;
        if (req.body.email != null) user.email = req.body.email;


        models.User.update(user, { where: { id } })
            .then(() => res.status(200).json({ message: "Details updated successfully" }))
            .catch(error => {
                console.error("Error updating Account:", error);
                res.status(500).json({ message: "Error updating details", error: error.message });
            });
    }
}

async function bulkUpdateUsers(req, res) {
    try {
        const usersToUpdate = req.body.users;

        if (!Array.isArray(usersToUpdate) || usersToUpdate.length === 0) {
            return res.status(400).json({ message: "No users provided for update" });
        }

        const results = [];

        for (const userData of usersToUpdate) {
            const { id, role } = userData;

            if (!id) {
                results.push({ id: null, success: false, message: "Missing user ID" });
                continue;
            }

            const userUpdates = {};

            if (role != null) userUpdates.role = role;

            // Add more fields if needed
            // if (userData.name) userUpdates.name = userData.name;

            const [updated] = await models.User.update(userUpdates, { where: { id } });

            if (updated === 0) {
                results.push({ id, success: false, message: "User not found or no changes made" });
            } else {
                results.push({ id, success: true, message: "User updated successfully" });
            }
        }

        res.status(200).json({ message: "Bulk update completed", results });

    } catch (error) {
        console.error("Bulk update error:", error);
        res.status(500).json({ message: "Bulk update failed", error: error.message });
    }
}

async function deleteAccount(req, res) {
    const data = await req.userData;

    if (data) {
        const id = data.userId;

        models.User.destroy({ where: { id } })
            .then(() => {
                res.clearCookie('accessToken');
                res.clearCookie('refreshToken');
                return res.status(409).json({
                    message: "Account deleted successfully"
                });
            })
            .catch(error => {
                console.error("Error deleting Account:", error);
                res.status(500).json({ message: "Error deleting account", error: error.message });
            });
    }
}

async function beAdmin(req, res) {
    const data = await req.userData;

    if (data) {
        const id = data.userId;

        if (req.query.code == 'BAdmin2025') {

            let user = {
                role: 'admin'
            };
            models.User.update(user, { where: { id } })
                .then(() => {
                    return res.status(200).json({
                        message: 'Authentication successful'
                    });
                }
                )
                .catch(error => {
                    console.error("Error updating Account:", error);
                    res.status(500).json({ message: "Error updating details", error: error.message });
                });

        } else if (req.query.code == 'BWriter2025') {

            let user = {
                role: 'writer'
            };
            models.User.update(user, { where: { id } })
                .then(() => {
                    return res.status(200).json({
                        message: 'Authentication successful'
                    });
                }
                )
                .catch(error => {
                    console.error("Error updating Account:", error);
                    res.status(500).json({ message: "Error updating details", error: error.message });
                });

        } else if (req.query.code == 'BEditor2025') {

            let user = {
                role: 'editor'
            };
            models.User.update(user, { where: { id } })
                .then(() => {
                    return res.status(200).json({
                        message: 'Authentication successful'
                    });
                }
                )
                .catch(error => {
                    console.error("Error updating Account:", error);
                    res.status(500).json({ message: "Error updating details", error: error.message });
                });

        } else {
            res.status(500).json({ message: "Invalid CODE" });
        }
    }
}

async function admin(req, res) {
    const data = await req.userData;
    console.log(data);

    if (data && await data.role == "Admin") {

        if (req.query.id) {

            const id = req.query.id;

            models.User.findByPk(id).then(result => {
                if (result) {
                    let message = `${result.first_name} is now an admin`

                    let user = {
                        role: 'Admin'
                    };
                    if (result.role == 'Admin') {
                        message = `${result.first_name} is nolonger an admin`
                        user = {
                            role: 'user'
                        };
                    }
                    models.User.update(user, { where: { id } })
                        .then(() => res.status(200).json({ message }))
                        .catch(error => {
                            console.error("Error updating Account:", error);
                            res.status(500).json({ message: "Error updating details", error: error.message });
                        });
                } else {
                    res.status(404).json({
                        message: "User not found!"
                    })
                }
            }).catch(error => {
                res.status(500).json({ message: "Something went wrong", error: error.message });

            });

        } else {
            res.status(500).json({ message: "Invalid" });
        }
    } else {
        res.status(500).json({ message: "Not Authorized" });
    }
}

module.exports = {
    signUp: signUp,
    logout: logout,
    show: show,
    login: login,
    getUser,
    deleteAccount,
    all,
    update,
    admin,
    beAdmin,
    team,
    bulkUpdateUsers,
    findUser,
}

