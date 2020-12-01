import React from "react";
import {createClient} from "@supabase/supabase-js";

const log = console;

export const supabase = createClient(
  process.env.REACT_APP_SUPBASE_URL!,
  process.env.REACT_APP_SUPABASE_KEY! );

export function EmailLogin(){
  const [forceRender, setForceRender] = React.useState(0);

  const storedToken = localStorage.getItem('supabase.auth.token')
  log.debug("EmailLogin render()"+
    ` forceRender=${forceRender}`+
    ` storedToken=${!!storedToken}`+
    ` session=${supabase.auth.session()}` );

  React.useEffect(()=>{
    supabase.auth.onAuthStateChange((event, session)=>{
      log.debug("onAuthStateChange()", {event, session});
      setForceRender((value)=>{
        log.debug("forcing render because auth state change");
        return value+1;
      });
    });

    // this is just for debugging, to show that the SB session appears
    // to be set asyncronously, with no authStateChange fired
    setTimeout(()=>{
      log.debug("EmailLogin setTimeout()" +
        ` session.user.email=${supabase.auth.session()?.user?.email}`);
    }, 200);
  }, [])


  return <div>

    <br/><hr/><br/>
    <EmailLoginForm/>

    <br/><hr/><br/>
    <CurrentUserWidget onClick={()=>{
      setForceRender((value)=>{
        log.debug("forcing render because button click");
        return value+1;
      });
    }}/>

    <br/><hr/><br/>
    <LogoutForm/>

  </div>
}

function CurrentUserWidget({onClick}:{onClick: ()=>void}){
  return <div>
    <div>current session email: {supabase.auth.session()?.user?.email}</div>
    <br/>
    <button onClick={e=>{e.preventDefault();onClick();}}>
      force render
    </button>
  </div>
}

function LogoutForm(){
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  return <button disabled={isLoggingOut} onClick={async e => {
    e.preventDefault();
    setIsLoggingOut(true);
    // doesn't need to force render because onAuthStateChange() will fire
    try {
      await supabase.auth.signOut();
    }
    finally {
      setIsLoggingOut(false);
    }
  }}>
    log out
  </button>
}

function EmailLoginForm(){
  const [email, setEmail] = React.useState("wibble@wobble");
  const [password, setPassword] = React.useState("pass");
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const [loginError, setLoginError] = React.useState(undefined as
    undefined | any);

  async function onLoginSubmit(event: React.FormEvent){
    event.preventDefault();
    log.debug("onLoginSubmit() called");

    setIsLoggingIn(true);
    setLoginError(undefined);

    try {
      // doesn't need to force render because onAuthStateChange() will fire
      const result = await supabase.auth.signIn({email, password});
      log.debug("sb login result", result);

      if( result.error ){
        log.debug("login failed", result.error);
        setLoginError(result.error);
      }
    }
    finally {
      setIsLoggingIn(false);
    }
  }

  let canClickLogin = email && password;

  return <div>
    <div>
      Click to Login (user already exists)
      <br/>
      <br/>
    </div>
    <form onSubmit={onLoginSubmit} noValidate autoComplete="off">
      <div>
        <label>email</label>
        <input type="text" id="emailInputField"
          value={email}
          onChange={(e)=>setEmail(e.currentTarget.value)}
          disabled={isLoggingIn}
          autoComplete="on"
        />
      </div>
      <div>
        <label>password</label>
        <input type="text" id="passwordInputField"
          value={password}
          onChange={(e)=>setPassword(e.currentTarget.value)}
          disabled={isLoggingIn}
          autoComplete="on"
        />
      </div>
      <br/>
      { loginError &&
        <div>
          <pre style={{overflowX: 'auto'}}>
            {loginError?.toString()}
          </pre>
        </div>
      }
      <button type="submit" disabled={!canClickLogin || isLoggingIn}>
        Log in
      </button>
    </form>
  </div>
}