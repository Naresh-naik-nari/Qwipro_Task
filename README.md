# Customer Management System

A comprehensive full-stack customer management system with advanced CRUD operations, multiple address support, and responsive design.

## Features

### Backend Features
- ✅ **Enhanced User Schema** with multiple address support
- ✅ **Advanced CRUD Operations** with comprehensive validation
- ✅ **Multiple Address Management** (add, update, delete, set default)
- ✅ **Advanced Search & Filtering** (by city, state, pincode, address type)
- ✅ **Comprehensive Error Handling** with logging system
- ✅ **Pagination & Sorting** with multiple options
- ✅ **Input Validation** with detailed error messages
- ✅ **Database Indexing** for optimal performance

### Frontend Features
- ✅ **Responsive Design** optimized for all devices
- ✅ **Advanced Registration Form** with address management
- ✅ **Enhanced Customer Profile** with multiple addresses display
- ✅ **Advanced Search & Filtering** interface
- ✅ **Real-time Validation** with user feedback
- ✅ **Mobile-Optimized** interface
- ✅ **Modern UI/UX** with Bootstrap components

### Mobile & Web CRUD Operations
- ✅ **Create New Customer** with validation and success messages
- ✅ **Read Customer Details** with organized profile layout
- ✅ **Update Customer Information** with confirmation messages
- ✅ **Delete Customer Records** with confirmation dialogs
- ✅ **View Multiple Addresses** with search functionality
- ✅ **Save Updated Addresses** through API calls
- ✅ **Mark Single Address Customers** with proper flagging
- ✅ **Search by Location** (city, state, pincode)
- ✅ **Clear Filters** functionality
- ✅ **Page Navigation** with sorting options

## Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Multer** for file uploads
- **Jest** for testing
- **Supertest** for API testing
- **Moment.js** for date handling
- **Validator** for input validation

### Frontend
- **React.js** with functional components
- **React Router** for navigation
- **Bootstrap 5** for responsive design
- **React Bootstrap** components
- **React Select** for dropdowns
- **React Toastify** for notifications
- **Axios** for API calls
- **Font Awesome** for icons

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

4. **Start the server**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

## API Endpoints

### Basic CRUD Operations
- `POST /api/user/register` - Create new customer
- `GET /api/user/details` - Get customers with filtering
- `GET /api/user/:id` - Get single customer
- `PUT /api/user/edit/:id` - Update customer
- `DELETE /api/user/delete/:id` - Delete customer
- `PUT /api/user/status/:id` - Change customer status

### Address Management
- `POST /api/user/:id/address` - Add address to customer
- `PUT /api/user/:id/address/:addressId` - Update address
- `DELETE /api/user/:id/address/:addressId` - Delete address
- `PUT /api/user/:id/address/:addressId/default` - Set default address

### Search & Filtering
- `GET /api/user/search/location` - Search by location
- `GET /api/user/multiple-addresses` - Get customers with multiple addresses
- `GET /api/user/single-addresses` - Get customers with single address
- `GET /api/user/clear-filters` - Clear all filters

### Utility
- `GET /api/userexport` - Export customers to CSV
- `GET /health` - Health check endpoint