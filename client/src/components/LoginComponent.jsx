import React, {useState} from 'react'

const LoginComponent = () => {
    
    // hooks for username, password, and errors during form submission
    const [username, setUsername] = "";
    const [password, setPassword] = "";
    const [error, setError] = "";

    // submission function
    const submit = () => {
        // check username is valid
        // check

    }
  return (

    <div className='flex justify-center'>
        <form className='flex flex-col'>
            <label>Username</label>
            <input class="outline mb-4" type="text"/>
            <label>Password</label>
            <input class="outline mb-4" type="text"/>
            <input class="outline my-4 hover:bg-amber-200" type="submit" value="Submit!"/>
        </form>
    </div>
 
  )
}

export default LoginComponent