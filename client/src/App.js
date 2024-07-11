import React, { useState, useEffect } from 'react';
import axios from 'axios';

const App = () => {
  const [backendData, setBackendData] = useState({ users: [] });
  const [userName, setNewUser] = useState({ name: "", privileges: "default", password: "" });
  const [fullUser, setFullUser] = useState({ name: "", createTime: Date() });
  const [stateManager, setStateManager] = useState("menu");
  const [feedback, setFeedback] = useState("");

  const fetchUsers = () => {
    fetch("http://localhost:3000/api").then(
      response => response.json()
    ).then(
      data => { setBackendData(data) }
    ).catch(error => {
      console.error('Error fetching Data');
      console.error(backendData.users);
    });
  };

  useEffect(() => {
    fetchUsers();
  }, );

  const addUser = () => {
    console.log(userName);
    axios.post('http://localhost:3000/api/add-User', userName)
      .then(
        data => { console.log(data.data) }
      ).then(
        () => setNewUser({ name: "", privileges: "default", password: "" })
      ).then(
        fetchUsers
      ).then(
        data => {
          setFeedback(data);
        }
      ).catch(
        error =>{
        console.error('Error adding users',error)
        }
      );
  };

  const findUser = () => {
    axios.post('http://localhost:3000/api/find-User', { user: userName.name }
    ).then(
      response => {
        setFullUser({ name: response.data.name, createTime: new Date(response.data.createTime) });
        console.log(response);
      }
    ).then(
      response => console.log(response),
      console.log(fullUser),
      console.log(userName)
    ).catch(
      error => { console.error('Error finding User', error) }
    );
  };

  const deleteUser = () => {
    axios.post('http://localhost:3000/api/delete-User', { user: fullUser }
    ).then(
      response => {
        setFeedback(response.data);
        console.log(response);
      }
    ).then(
      console.log('Deleted successfully'),
      console.log(fullUser)
    ).catch(
      error => console.error('Error deleting User', error)
    );
  };

  return (
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
          <button onClick={findUser}>Find User</button>
          <button onClick={deleteUser}>Delete User</button>

          <p>Gefundener Nutzer: {fullUser.name}</p>

          <p>{feedback}</p>

          {(typeof backendData.users === 'undefined') ? (
            <p>loading...</p>
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
    <button onClick={addUser}>Save User</button>
    <button onClick={() => setStateManager('menu')}>Back to Main Menu</button>
  </div>
)}
</div>
);
};
export default App;