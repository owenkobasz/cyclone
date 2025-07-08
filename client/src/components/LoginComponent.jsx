import React, {useState, useEffect} from 'react'

const LoginComponent = () => {
        
        // hooks for username, password, and errors during form submission
        const [username, setUsername] = useState("");
        const [password, setPassword] = useState("");
        const [message, setMessage] = useState("");
        const [loggedin, setLoggedin] = useState(false);
        const [button, setButton] = useState("");

        // update login button based on login state
        useEffect(() => {
            if (!loggedin) {
                setButton("Login / Register");
            } else {
                setButton("Logout");
            }
        },[loggedin]);

        // submission function
        const submit = async (e) => {
            // prevent reload
            e.preventDefault();
            
            // try logging in
            if (!loggedin) {
                try {
                    // send a POST request to server
                    const res = await fetch('http://localhost:3000/api/register', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({username, password})
                    });

                    // set data to response from backend
                    const data = await res.json();

                    if(!res.ok) {
                        setMessage(`${data.message}`);
                    } else {
                        setMessage(`${data.message}`);
                        setLoggedin(true);
                    } 
                } catch(err) {
                    setMessage(`Error logging in`);
                }
            } else {
                setLoggedin(false);
                setUsername("");
                setPassword("");
                setMessage("");
            }
                       
        };

    return (

        <div className='flex flex-col justify-center items-center'>
            <h1 className='pb-4'>Welcome Please Login!</h1>
                <form className='flex flex-col border p-3 rounded-2xl'
                onSubmit={submit}>
                        <label>Username</label>
                        <input className="outline mb-4" type="text" value={username}
                        onChange={(e) => setUsername(e.target.value)}/>
                        <label>Password</label>
                        <input className="outline mb-4" type="password" value ={password}
                        onChange={(e) => setPassword(e.target.value)}/>
                        <p className='text-center'>{message}</p>
                        <input className="outline my-4 bg-blue-200 hover:bg-amber-200 rounded-2xl" 
                                type="submit" value={button}/>
                </form>
        </div>
 
    )
}

export default LoginComponent