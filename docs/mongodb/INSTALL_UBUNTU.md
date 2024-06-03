To install MongoDB on Ubuntu 20.04 and secure it with a username and password, follow these steps:

### Step 1: Import the MongoDB public GPG key

```bash
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | \
sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/mongodb-server-7.0.gpg
```

### Step 2: Create the MongoDB list file

Create a `/etc/apt/sources.list.d/mongodb-org-7.0.list` file for MongoDB.

```bash
echo "deb [ arch=amd64 signed=/etc/apt/trusted.gpg.d/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | \
sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
```

### Step 3: Update the local package database

```bash
sudo apt-get update && sudo apt-get upgrade
```

### Step 4: Install the MongoDB packages

```bash
sudo apt install -y mongodb-org
```

### Step 5: Start MongoDB

Start MongoDB with the following command:

```bash
sudo systemctl start mongod
```

### Step 6: Verify that MongoDB has started

Check the status of the MongoDB service:

```bash
sudo systemctl status mongod
```

### Step 7: Enable MongoDB to start on system reboot

```bash
sudo systemctl enable mongod
```

### Step 8: Secure MongoDB with a username and password

1. **Start the MongoDB shell**:

   ```bash
   mongosh
   ```

2. **Switch to the `admin` database**:

   ```javascript
   use admin
   ```

3. **Create an administrative user**:

   ```javascript
   db.createUser(
     {
       user: "myAdminUser",
       pwd: "myAdminPassword",
       roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
     }
   )
   ```

   Replace `"myAdminUser"` and `"myAdminPassword"` with your desired username and password.

4. **Enable authentication in the MongoDB configuration file**:

   Edit the MongoDB configuration file `/etc/mongod.conf` to enable security.

   ```bash
   sudo nano /etc/mongod.conf
   ```

   Add or uncomment the security section and include the following:

   ```yaml
   security:
     authorization: "enabled"
   ```

5. **Restart MongoDB to apply the changes**:

   ```bash
   sudo systemctl restart mongod
   ```

### Step 9: Verify authentication

1. **Start the MongoDB shell with authentication**:

   ```bash
   mongosh -u "myAdminUser" -p "myAdminPassword" --authenticationDatabase "admin"
   ```

2. **Verify that you can perform administrative actions**:

   ```javascript
   use admin
   db.runCommand({ connectionStatus: 1 })
   ```

   If you see an "authenticatedUsers" array with your username, authentication is working correctly.

By following these steps, you will have installed MongoDB on Ubuntu 20.04 and secured it with a username and password.
