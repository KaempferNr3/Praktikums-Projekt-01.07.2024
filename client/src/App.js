
//import logo from './logo.svg';
import React,{useState,useEffect} from 'react'
import axios from 'axios'
const App = () => {
  const [backendData, setBackendData] = useState({users: [] })
  const [userName, setNewUser] = useState("")
  const [fullUser, setFullUser] = useState(null)
  const fetchUsers = () => {
    fetch("http://localhost:3000/api").then(
      response => response.json()      
    ).then(
      data => {setBackendData(data)}
    ).catch(error => {
      console.error('Error fetching Data')
      console.error(backendData.users)
    })
  }
  useEffect(() => {
    fetchUsers();
  } ,  )
  const addUser = () => {
    console.log(userName);
    axios.post('http://localhost:3000/api/add-User' ,{user: userName})
    .then(    
      data => {console.log(data.data)}
    ).then(
      setNewUser("")
    ).then(
      fetchUsers()
    ).catch(error => 
      console.error('Error adding users')
    )
  }
  const findUser = () => {
     
    
    axios.post('http://localhost:3000/api/find-User' ,{user: userName}
    ).then(
      data => {
        setFullUser(data.data)
      }
    ).then(
      data => console.log(data)
    ).catch(
      console.error('Error finding User'),
      data => {console.error(data)},
      data => {console.error(data.status)},
      data => {console.error(data.data)}
    )
  }
  
  return (
    <div>
      <input 
        type= "text"
        value= {userName}
        onChange= {e => setNewUser(e.target.value)}
        placeholder='User Name'
      />
      <button onClick = {addUser}>Add User</button>
      <button onClick = {findUser}>Find User</button>
      {(typeof backendData.users === 'undefined') ? (
        <p>loading...</p>
      ): (
        backendData.users.map((user, i) => (
          <p key={i}>{user.name}</p>
        ))
      )}
    </div>
  );
}

export default App;