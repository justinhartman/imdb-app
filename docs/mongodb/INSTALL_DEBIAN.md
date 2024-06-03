To install MongoDB on Debian Bookworm and secure it with a username and password, follow these steps:

### Step 1: Import the MongoDB public GPG key

```bash
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | \
sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/mongodb-server-7.0.gpg
```

### Step 2: Create the MongoDB list file

Create a `/etc/apt/sources.list.d/mongodb-org-7.0.list` file for MongoDB.

```bash
echo "deb [ arch=amd64 signed=/etc/apt/trusted.gpg.d/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/debian bookworm/mongodb-org/7.0 main" | \
sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
```

### Step 3: Update the local package database

```bash
sudo apt-get update && sudo apt-get upgrade
```

### Step 4: Install the MongoDB packages

```bash
sudo apt-get install -y mongodb-org
```

### Step 5: Start MongoDB

Start MongoDB with the following command:

```bash
sudo service mongod start
```

### Step 6: Verify that MongoDB has started

Check the status of the MongoDB service:

```bash
sudo service mongod status
```

### Step 7: Enable MongoDB to start on system reboot

```bash
sudo systemctl enable mongod.service 
```

### Step 8: Secure MongoDB with a username and password

1. **Start the MongoDB shell**:

   ```console
   $ mongosh
   Current Mongosh Log ID: 665e1a713cc0a7be39a26a12
   Connecting to:          mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.2.6
   Using MongoDB:          7.0.11
   Using Mongosh:          2.2.6
   
   For mongosh info see: https://docs.mongodb.com/mongodb-shell/
   
   
   To help improve our products, anonymous usage data is collected and sent to MongoDB periodically (https://www.mongodb.com/legal/privacy-policy).
   You can opt-out by running the disableTelemetry() command.
   
   ------
   The server generated these startup warnings when booting
   2024-06-03T19:32:22.184+00:00: Using the XFS filesystem is strongly recommended with the WiredTiger storage engine. See http://dochub.mongodb.org/core/prodnotes-filesystem
   2024-06-03T19:32:22.785+00:00: Access control is not enabled for the database. Read and write access to data and configuration is unrestricted
   2024-06-03T19:32:22.785+00:00: /sys/kernel/mm/transparent_hugepage/enabled is 'always'. We suggest setting it to 'never' in this binary version
   2024-06-03T19:32:22.785+00:00: vm.max_map_count is too low
   ------
   ```

2. **Switch to the `admin` database**:

   ```console
   $ use admin
   switched to db admin
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
   sudo service mongod restart
   ```

### Step 9: Verify authentication

1. **Start the MongoDB shell with authentication**:

   ```bash
   mongosh -u "myAdminUser" -p "myAdminPassword" --authenticationDatabase "admin"
   ```

2. **Verify that you can perform administrative actions**:

   ```console
   $ test> use admin
   switched to db admin
   $ admin> db.runCommand({ connectionStatus: 1 })
   {
     authInfo: {
       authenticatedUsers: [ { user: 'myAdminUser', db: 'admin' } ],
       authenticatedUserRoles: [ { role: 'myAdminPassword', db: 'admin' } ]
     },
     ok: 1
   }
   ```

   If you see an "authenticatedUsers" array with your username, authentication is working correctly.

By following these steps, you will have installed MongoDB on Debian Bookworm and secured it with a username and password.
