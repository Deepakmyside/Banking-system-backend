# Banking System Backend

A robust and secure backend implementation for a banking system, built with Node.js, Express, and MongoDB. The system emphasizes security, transactional integrity, and idempotency for core financial operations.

## Key Features

- **Authentication & Authorization**: Secure user registration, login, and logout functionalities utilizing JWT (JSON Web Tokens) and secure password hashing with `bcryptjs`.
- **Account Management**: Users can create multiple banking accounts, fetch associated accounts, and retrieve balances.
- **Transactions & Transfers**:
  - Secure and reliable inter-account funds transfers.
  - Transactions run within **MongoDB Sessions/Transactions**, meaning that if any part of the process fails (e.g., deducting funds, crediting funds), the entire operation rolls back to prevent inconsistent states.
- **Ledger System**: Implemented a Double-Entry Bookkeeping Ledger. Every transaction creates corresponding `DEBIT` and `CREDIT` entries in a separate Ledger collection, bringing higher auditing integrity to account balances. Account balances are dynamically derived from ledger entries rather than just updating a static balance value.
- **Idempotency Key Support**: Money transfer APIs require an `idempotencyKey` parameter. This prevents duplicate transfers (like accidental double-clicks from clients) by guaranteeing that the identical request processed multiple times produces the very same result as being processed only once.
- **Email Notifications**: Integrated `nodemailer` to trigger automated email updates upon successful transaction completions.

## Tech Stack
- **JavaScript Runtime**: Node.js
- **Web Framework**: Express.js
- **Database**: MongoDB (with Mongoose ODM)
- **Security**: `bcryptjs` (Hashing), `jsonwebtoken` (Auth Tokens), `cookie-parser`
- **Mail Service**: `nodemailer`

## API Endpoints Overview

### Authentication (`/api/auth`)
- `POST /register` - Register a new user.
- `POST /login` - Authenticate a user and set access tokens.
- `POST /logout` - Invalidate the current session.

### Accounts (`/api/accounts`)
- `POST /` - Create a new bank account for the logged-in user.
- `GET /` - Retrieve all accounts linked to the logged-in user.
- `GET /balance/:accountId` - Retrieve the current balance for a specified account.

### Transactions (`/api/transactions`)
- `POST /` - Create a new funds transfer transaction (requires `fromAccount`, `toAccount`, `amount`, and `idempotencyKey`).
- `POST /system/intial-funds` - Admin/System endpoint to seed accounts with initial funds.

## Core Flow: 1-Step Transfer
For every transfer request, the system ensures precision through the following sequence:
1. Validates request body and checks **Idempotency Key** to avoid duplicate processing.
2. Verifies that both sender and receiver accounts are ACTIVE.
3. Derives the sender's true balance dynamically from past ledger entries.
4. Starts a MongoDB Transaction.
5. Records the Transaction as `PENDING`.
6. Generates a `DEBIT` ledger entry for the sender.
7. Generates a `CREDIT` ledger entry for the receiver.
8. Marks the Transaction as `COMPLETED`.
9. Commits the MongoDB Session.
10. Dispatches an email notification to the user.

## Error Handling
The API follows a cohesive error handling pattern to deliver standardized status codes and comprehensible feedback signals covering cases such as missing parameters, invalid accounts, insufficient balance, locked accounts, and systemic issues.

## License
ISC
