const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const users = require('../models/usersSchema');

// Test database setup
const testDB = 'mongodb://localhost:27017/customer_management_test';

beforeAll(async () => {
    await mongoose.connect(testDB);
});

afterAll(async () => {
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
});

beforeEach(async () => {
    await users.deleteMany({});
});

describe('Customer CRUD Operations', () => {
    let testCustomer;
    let testAddress;

    beforeEach(() => {
        testAddress = {
            addressType: 'home',
            addressLine1: '123 Test Street',
            addressLine2: 'Apt 4B',
            city: 'Test City',
            state: 'Test State',
            pincode: '123456',
            country: 'India',
            isDefault: true
        };

        testCustomer = {
            fname: 'John',
            lname: 'Doe',
            email: 'john.doe@test.com',
            mobile: '9876543210',
            gender: 'Male',
            status: 'Active',
            profile: 'test-profile.jpg',
            location: 'Test Location',
            dateOfBirth: '1990-01-01',
            addresses: [testAddress]
        };
    });

    describe('POST /api/user/register - Create Customer', () => {
        it('should create a new customer with valid data', async () => {
            const response = await request(app)
                .post('/api/user/register')
                .field('fname', testCustomer.fname)
                .field('lname', testCustomer.lname)
                .field('email', testCustomer.email)
                .field('mobile', testCustomer.mobile)
                .field('gender', testCustomer.gender)
                .field('status', testCustomer.status)
                .field('location', testCustomer.location)
                .field('dateOfBirth', testCustomer.dateOfBirth)
                .field('addresses', JSON.stringify(testCustomer.addresses))
                .attach('user_profile', Buffer.from('fake image data'), 'test.jpg');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.fname).toBe(testCustomer.fname);
            expect(response.body.data.email).toBe(testCustomer.email);
            expect(response.body.data.addresses).toHaveLength(1);
        });

        it('should fail to create customer with missing required fields', async () => {
            const response = await request(app)
                .post('/api/user/register')
                .field('fname', testCustomer.fname)
                .field('email', testCustomer.email)
                // Missing lname, mobile, gender, status, profile

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should fail to create customer with duplicate email', async () => {
            // Create first customer
            await request(app)
                .post('/api/user/register')
                .field('fname', testCustomer.fname)
                .field('lname', testCustomer.lname)
                .field('email', testCustomer.email)
                .field('mobile', testCustomer.mobile)
                .field('gender', testCustomer.gender)
                .field('status', testCustomer.status)
                .field('addresses', JSON.stringify(testCustomer.addresses))
                .attach('user_profile', Buffer.from('fake image data'), 'test.jpg');

            // Try to create second customer with same email
            const response = await request(app)
                .post('/api/user/register')
                .field('fname', 'Jane')
                .field('lname', 'Doe')
                .field('email', testCustomer.email) // Same email
                .field('mobile', '9876543211')
                .field('gender', 'Female')
                .field('status', 'Active')
                .field('addresses', JSON.stringify(testCustomer.addresses))
                .attach('user_profile', Buffer.from('fake image data'), 'test2.jpg');

            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
        });

        it('should fail to create customer with invalid email format', async () => {
            const response = await request(app)
                .post('/api/user/register')
                .field('fname', testCustomer.fname)
                .field('lname', testCustomer.lname)
                .field('email', 'invalid-email')
                .field('mobile', testCustomer.mobile)
                .field('gender', testCustomer.gender)
                .field('status', testCustomer.status)
                .field('addresses', JSON.stringify(testCustomer.addresses))
                .attach('user_profile', Buffer.from('fake image data'), 'test.jpg');

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should fail to create customer with invalid mobile number', async () => {
            const response = await request(app)
                .post('/api/user/register')
                .field('fname', testCustomer.fname)
                .field('lname', testCustomer.lname)
                .field('email', testCustomer.email)
                .field('mobile', '123456789') // Invalid mobile (9 digits)
                .field('gender', testCustomer.gender)
                .field('status', testCustomer.status)
                .field('addresses', JSON.stringify(testCustomer.addresses))
                .attach('user_profile', Buffer.from('fake image data'), 'test.jpg');

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/user/details - Get Customers', () => {
        beforeEach(async () => {
            // Create test customers
            const customer1 = new users({
                ...testCustomer,
                email: 'customer1@test.com',
                mobile: '9876543210'
            });
            await customer1.save();

            const customer2 = new users({
                ...testCustomer,
                fname: 'Jane',
                email: 'customer2@test.com',
                mobile: '9876543211',
                addresses: [
                    {
                        ...testAddress,
                        city: 'Different City',
                        state: 'Different State'
                    }
                ]
            });
            await customer2.save();
        });

        it('should get all customers with pagination', async () => {
            const response = await request(app)
                .get('/api/user/details')
                .query({ page: 1, limit: 10 });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.users).toHaveLength(2);
            expect(response.body.data.pagination.totalItems).toBe(2);
        });

        it('should search customers by name', async () => {
            const response = await request(app)
                .get('/api/user/details')
                .query({ search: 'John' });

            expect(response.status).toBe(200);
            expect(response.body.data.users).toHaveLength(1);
            expect(response.body.data.users[0].fname).toBe('John');
        });

        it('should filter customers by gender', async () => {
            const response = await request(app)
                .get('/api/user/details')
                .query({ gender: 'Male' });

            expect(response.status).toBe(200);
            expect(response.body.data.users).toHaveLength(1);
            expect(response.body.data.users[0].gender).toBe('Male');
        });

        it('should filter customers by status', async () => {
            const response = await request(app)
                .get('/api/user/details')
                .query({ status: 'Active' });

            expect(response.status).toBe(200);
            expect(response.body.data.users).toHaveLength(2);
        });

        it('should search customers by city', async () => {
            const response = await request(app)
                .get('/api/user/details')
                .query({ city: 'Test City' });

            expect(response.status).toBe(200);
            expect(response.body.data.users).toHaveLength(1);
        });

        it('should search customers by state', async () => {
            const response = await request(app)
                .get('/api/user/details')
                .query({ state: 'Different State' });

            expect(response.status).toBe(200);
            expect(response.body.data.users).toHaveLength(1);
        });

        it('should search customers by pincode', async () => {
            const response = await request(app)
                .get('/api/user/details')
                .query({ pincode: '123456' });

            expect(response.status).toBe(200);
            expect(response.body.data.users).toHaveLength(2);
        });

        it('should filter customers with single address', async () => {
            const response = await request(app)
                .get('/api/user/details')
                .query({ isSingleAddress: 'true' });

            expect(response.status).toBe(200);
            expect(response.body.data.users).toHaveLength(2);
        });
    });

    describe('GET /api/user/:id - Get Single Customer', () => {
        let customerId;

        beforeEach(async () => {
            const customer = new users(testCustomer);
            const savedCustomer = await customer.save();
            customerId = savedCustomer._id;
        });

        it('should get a single customer by ID', async () => {
            const response = await request(app)
                .get(`/api/user/${customerId}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data._id.toString()).toBe(customerId.toString());
            expect(response.body.data.fname).toBe(testCustomer.fname);
        });

        it('should return 404 for non-existent customer', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .get(`/api/user/${fakeId}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });

        it('should return 400 for invalid customer ID format', async () => {
            const response = await request(app)
                .get('/api/user/invalid-id');

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/user/edit/:id - Update Customer', () => {
        let customerId;

        beforeEach(async () => {
            const customer = new users(testCustomer);
            const savedCustomer = await customer.save();
            customerId = savedCustomer._id;
        });

        it('should update customer information', async () => {
            const updateData = {
                fname: 'John Updated',
                lname: 'Doe Updated',
                email: 'john.updated@test.com',
                mobile: '9876543210',
                gender: 'Male',
                status: 'Active',
                location: 'Updated Location'
            };

            const response = await request(app)
                .put(`/api/user/edit/${customerId}`)
                .field('fname', updateData.fname)
                .field('lname', updateData.lname)
                .field('email', updateData.email)
                .field('mobile', updateData.mobile)
                .field('gender', updateData.gender)
                .field('status', updateData.status)
                .field('location', updateData.location)
                .field('user_profile', 'existing-profile.jpg')
                .attach('user_profile', Buffer.from('fake image data'), 'updated.jpg');

            expect(response.status).toBe(200);
            expect(response.body.fname).toBe(updateData.fname);
            expect(response.body.lname).toBe(updateData.lname);
        });

        it('should return 404 for non-existent customer', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .put(`/api/user/edit/${fakeId}`)
                .field('fname', 'Updated')
                .field('lname', 'Name')
                .field('email', 'updated@test.com')
                .field('mobile', '9876543210')
                .field('gender', 'Male')
                .field('status', 'Active')
                .field('user_profile', 'existing.jpg');

            expect(response.status).toBe(401);
        });
    });

    describe('DELETE /api/user/delete/:id - Delete Customer', () => {
        let customerId;

        beforeEach(async () => {
            const customer = new users(testCustomer);
            const savedCustomer = await customer.save();
            customerId = savedCustomer._id;
        });

        it('should delete a customer', async () => {
            const response = await request(app)
                .delete(`/api/user/delete/${customerId}`);

            expect(response.status).toBe(200);
            expect(response.body._id.toString()).toBe(customerId.toString());

            // Verify customer is deleted
            const deletedCustomer = await users.findById(customerId);
            expect(deletedCustomer).toBeNull();
        });

        it('should return 401 for non-existent customer', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .delete(`/api/user/delete/${fakeId}`);

            expect(response.status).toBe(401);
        });
    });

    describe('Address Management', () => {
        let customerId;

        beforeEach(async () => {
            const customer = new users(testCustomer);
            const savedCustomer = await customer.save();
            customerId = savedCustomer._id;
        });

        describe('POST /api/user/:id/address - Add Address', () => {
            it('should add a new address to customer', async () => {
                const newAddress = {
                    addressType: 'work',
                    addressLine1: '456 Work Street',
                    city: 'Work City',
                    state: 'Work State',
                    pincode: '654321',
                    country: 'India',
                    isDefault: false
                };

                const response = await request(app)
                    .post(`/api/user/${customerId}/address`)
                    .send(newAddress);

                expect(response.status).toBe(200);
                expect(response.body.data.addresses).toHaveLength(2);
            });

            it('should fail to add address with invalid data', async () => {
                const invalidAddress = {
                    addressType: 'work',
                    // Missing required fields: addressLine1, city, state, pincode
                };

                const response = await request(app)
                    .post(`/api/user/${customerId}/address`)
                    .send(invalidAddress);

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });

        describe('PUT /api/user/:id/address/:addressId - Update Address', () => {
            let addressId;

            beforeEach(async () => {
                const customer = await users.findById(customerId);
                addressId = customer.addresses[0]._id;
            });

            it('should update an existing address', async () => {
                const updateData = {
                    addressLine1: 'Updated Address Line 1',
                    city: 'Updated City',
                    state: 'Updated State'
                };

                const response = await request(app)
                    .put(`/api/user/${customerId}/address/${addressId}`)
                    .send(updateData);

                expect(response.status).toBe(200);
                const updatedAddress = response.body.data.addresses.find(addr => 
                    addr._id.toString() === addressId.toString()
                );
                expect(updatedAddress.addressLine1).toBe(updateData.addressLine1);
            });

            it('should return 404 for non-existent address', async () => {
                const fakeAddressId = new mongoose.Types.ObjectId();
                const response = await request(app)
                    .put(`/api/user/${customerId}/address/${fakeAddressId}`)
                    .send({ addressLine1: 'Updated' });

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
            });
        });

        describe('DELETE /api/user/:id/address/:addressId - Delete Address', () => {
            let addressId;

            beforeEach(async () => {
                // Add a second address first
                const newAddress = {
                    addressType: 'work',
                    addressLine1: '456 Work Street',
                    city: 'Work City',
                    state: 'Work State',
                    pincode: '654321',
                    country: 'India',
                    isDefault: false
                };

                await request(app)
                    .post(`/api/user/${customerId}/address`)
                    .send(newAddress);

                const customer = await users.findById(customerId);
                addressId = customer.addresses[1]._id; // Get the second address
            });

            it('should delete an address', async () => {
                const response = await request(app)
                    .delete(`/api/user/${customerId}/address/${addressId}`);

                expect(response.status).toBe(200);
                expect(response.body.data.addresses).toHaveLength(1);
            });

            it('should not allow deleting the last address', async () => {
                // First delete the second address
                await request(app)
                    .delete(`/api/user/${customerId}/address/${addressId}`);

                const customer = await users.findById(customerId);
                const lastAddressId = customer.addresses[0]._id;

                const response = await request(app)
                    .delete(`/api/user/${customerId}/address/${lastAddressId}`);

                expect(response.status).toBe(200);
                // Should still have 1 address (the last one cannot be deleted)
                expect(response.body.data.addresses).toHaveLength(1);
            });
        });

        describe('PUT /api/user/:id/address/:addressId/default - Set Default Address', () => {
            let addressId1, addressId2;

            beforeEach(async () => {
                // Add a second address
                const newAddress = {
                    addressType: 'work',
                    addressLine1: '456 Work Street',
                    city: 'Work City',
                    state: 'Work State',
                    pincode: '654321',
                    country: 'India',
                    isDefault: false
                };

                await request(app)
                    .post(`/api/user/${customerId}/address`)
                    .send(newAddress);

                const customer = await users.findById(customerId);
                addressId1 = customer.addresses[0]._id;
                addressId2 = customer.addresses[1]._id;
            });

            it('should set an address as default', async () => {
                const response = await request(app)
                    .put(`/api/user/${customerId}/address/${addressId2}/default`);

                expect(response.status).toBe(200);
                
                const defaultAddress = response.body.data.addresses.find(addr => addr.isDefault);
                expect(defaultAddress._id.toString()).toBe(addressId2.toString());
            });
        });
    });

    describe('Search and Filter Endpoints', () => {
        beforeEach(async () => {
            // Create test customers with different addresses
            const customer1 = new users({
                ...testCustomer,
                email: 'customer1@test.com',
                mobile: '9876543210',
                addresses: [{
                    ...testAddress,
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    pincode: '400001'
                }]
            });
            await customer1.save();

            const customer2 = new users({
                ...testCustomer,
                fname: 'Jane',
                email: 'customer2@test.com',
                mobile: '9876543211',
                addresses: [
                    {
                        ...testAddress,
                        city: 'Delhi',
                        state: 'Delhi',
                        pincode: '110001'
                    },
                    {
                        ...testAddress,
                        city: 'Mumbai',
                        state: 'Maharashtra',
                        pincode: '400002',
                        isDefault: false
                    }
                ]
            });
            await customer2.save();
        });

        describe('GET /api/user/search/location - Search by Location', () => {
            it('should search customers by city', async () => {
                const response = await request(app)
                    .get('/api/user/search/location')
                    .query({ city: 'Mumbai' });

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data).toHaveLength(2);
            });

            it('should search customers by state', async () => {
                const response = await request(app)
                    .get('/api/user/search/location')
                    .query({ state: 'Maharashtra' });

                expect(response.status).toBe(200);
                expect(response.body.data).toHaveLength(2);
            });

            it('should search customers by pincode', async () => {
                const response = await request(app)
                    .get('/api/user/search/location')
                    .query({ pincode: '400001' });

                expect(response.status).toBe(200);
                expect(response.body.data).toHaveLength(1);
            });

            it('should return 400 if no location parameters provided', async () => {
                const response = await request(app)
                    .get('/api/user/search/location');

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });

        describe('GET /api/user/multiple-addresses - Get Multiple Address Customers', () => {
            it('should get customers with multiple addresses', async () => {
                const response = await request(app)
                    .get('/api/user/multiple-addresses');

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data).toHaveLength(1);
                expect(response.body.data[0].fname).toBe('Jane');
            });
        });

        describe('GET /api/user/single-addresses - Get Single Address Customers', () => {
            it('should get customers with single address', async () => {
                const response = await request(app)
                    .get('/api/user/single-addresses');

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data).toHaveLength(1);
                expect(response.body.data[0].fname).toBe('John');
            });
        });

        describe('GET /api/user/clear-filters - Clear Filters', () => {
            it('should return all customers without filters', async () => {
                const response = await request(app)
                    .get('/api/user/clear-filters')
                    .query({ page: 1, limit: 10 });

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data.users).toHaveLength(2);
            });
        });
    });

    describe('Export Functionality', () => {
        beforeEach(async () => {
            const customer = new users(testCustomer);
            await customer.save();
        });

        describe('GET /api/userexport - Export to CSV', () => {
            it('should export customers to CSV', async () => {
                const response = await request(app)
                    .get('/api/userexport');

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.downloadUrl).toBeDefined();
            });
        });
    });

    describe('Status Management', () => {
        let customerId;

        beforeEach(async () => {
            const customer = new users(testCustomer);
            const savedCustomer = await customer.save();
            customerId = savedCustomer._id;
        });

        describe('PUT /api/user/status/:id - Change Status', () => {
            it('should change customer status', async () => {
                const response = await request(app)
                    .put(`/api/user/status/${customerId}`)
                    .send({ data: 'InActive' });

                expect(response.status).toBe(200);
                expect(response.body.status).toBe('InActive');
            });
        });
    });
});

describe('Error Handling', () => {
    it('should handle invalid routes', async () => {
        const response = await request(app)
            .get('/api/invalid-route');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
    });

    it('should handle server errors gracefully', async () => {
        // This test would require mocking database errors
        // For now, we'll test the error response format
        const response = await request(app)
            .get('/api/user/invalid-id-format');

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });
});

