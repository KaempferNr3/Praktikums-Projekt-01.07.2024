import React, { useState, useEffect } from 'react';
import axios from 'axios';
import crypto from 'crypto-browserify';

const App = () => {
  const [backendData, setBackendData] = useState({ users: [] });
  const [userName, setNewUser] = useState({ name: "", privileges: "default", password: "" });
  const [fullUser, setFullUser] = useState({ name: "", createTime: new Date() });
  const [stateManager, setStateManager] = useState("menu");
  const [feedback, setFeedback] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [aesKey, setAesKey] = useState("");
  const [uniqueID, setUniqueID] = useState("");
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    fetchPublicKey();
  }, []);

  const fetchPublicKey = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/public-key');
      setPublicKey(response.data);
    } catch (error) {
      console.error('Error fetching public key:', error);
    }
  };

  const encryptRSA = (text, publicKey) => {
    const buffer = Buffer.from(text, 'utf8');
    const encrypted = crypto.publicEncrypt({
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256'
    }, buffer);
    return encrypted.toString('hex');
  };

  const encryptAES = (text, aesKey) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(aesKey, 'hex'), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return { iv: iv.toString('hex'), data: encrypted };
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api');
      setBackendData(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleLogin = async () => {
    try {
      const encryptedCredentials = encryptRSA(JSON.stringify(credentials), publicKey);
      const response = await axios.post('http://localhost:3000/api/login', { data: encryptedCredentials });
      const decryptedAESKey = decryptRSA(response.data.aesKey);
      setAesKey(decryptedAESKey);
      setUniqueID(response.data.uniqueID);
      setIsLoggedIn(true);
      fetchUsers();
    } catch (error) {
      console.error('Error logging in:', error);
    }
  };

  const decryptRSA = (encryptedText) => {
    // Implement the decryption logic here using the private key in a secure way
    // Ensure the private key is securely available for decryption
  };

  const handleAddUser = async () => {
    try {
      const encryptedData = encryptAES(JSON.stringify(userName), aesKey);
      await axios.post('http://localhost:3000/api/add-User', { uniqueID, encryptedData });
      setNewUser({ name: "", privileges: "default", password: "" });
      fetchUsers();
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const handleFindUser = async () => {
    try {
      const encryptedData = encryptAES(JSON.stringify({ user: userName.name }), aesKey);
      const response = await axios.post('http://localhost:3000/api/find-User', { uniqueID, encryptedData });
      setFullUser({ name: response.data.name, createTime: new Date(response.data.createTime) });
    } catch (error) {
      console.error('Error finding user:', error);
    }
  };

  const handleDeleteUser = async () => {
    try {
      const encryptedData = encryptAES(JSON.stringify({ user: fullUser }), aesKey);
      const response = await axios.post('http://localhost:3000/api/delete-User', { uniqueID, encryptedData });
      setFeedback(response.data);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  return (
    <div>
      {!isLoggedIn ? (
        <div>
          <h2>Login</h2>
          <input
            type="text"
            value={credentials.username}
            onChange={e => setCredentials({ ...credentials, username: e.target.value })}
            placeholder='Username'
          />
          <input
            type="password"
            value={credentials.password}
            onChange={e => setCredentials({ ...credentials, password: e.target.value })}
            placeholder='Password'
          />
          <button onClick={handleLogin}>Login</button>
        </div>
      ) : (
        <div>
          {stateManager === 'menu' && (
            <div>
              <input
                type="text"
                value={userName.name}
                onChange={e => setNewUser({ ...userName, name: e.target.value })}
                placeholder='User Name'
              />
              <button onClick={() => setStateManager('add-User')}>Add User</button>
              <button onClick={handleFindUser}>Find User</button>
              <button onClick={handleDeleteUser}>Delete User</button>
              <p>Found User: {fullUser.name}</p>
              <p>{feedback}</p>
              {backendData.users.length === 0 ? (
                <p>Loading...</p>
              ) : (
                backendData.users.map((user, i) => (
                  <p key={i}>{user.name}</p>
                ))
              )}
            </div>
          )}
          {stateManager === 'add-User' && (
            <div>
              <label>
                User Name:
                <input
                  type="text"
                  value={userName.name}
                  onChange={e => setNewUser({ ...userName, name: e.target.value })}
                  placeholder='User Name'
                />
              </label>
              <br />
              <label>
                Privileges:
                <input
                  type="text"
                  value={userName.privileges}
                  onChange={e => setNewUser({ ...userName, privileges: e.target.value })}
                  placeholder='Privileges'
                />
              </label>
              <br />
              <label>
                Password:
                <input
                  type="password"
                  value={userName.password}
                  onChange={e => setNewUser({ ...userName, password: e.target.value })}
                  placeholder='Password'
                />
              </label>
              <br />
              <button onClick={handleAddUser}>Save User</button>
              <button onClick={() => setStateManager('menu')}>Back to Main Menu</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
