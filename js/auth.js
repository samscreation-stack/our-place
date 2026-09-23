/* =========================================================
   OUR PLACE
   PHASE 2.5 — AUTHENTICATION
========================================================= */


/*
    Keep the current authenticated user available
    to the rest of the website.
*/
window.ourPlaceCurrentUser = null;


/* =========================================================
   AUTH UI HELPERS
========================================================= */

function getAuthGate() {

  return document.getElementById("authGate");

}


function getAuthLoading() {

  return document.getElementById("authLoading");

}


function getAuthLogin() {

  return document.getElementById("authLogin");

}


function getAuthError() {

  return document.getElementById("authError");

}


function setAuthMessage(message) {

  const error = getAuthError();

  if (!error) {
    return;
  }

  error.textContent = message || "";

}


function setAuthLoading(isLoading) {

  const body = document.body;

  const gate = getAuthGate();

  const loading = getAuthLoading();

  const login = getAuthLogin();

  const submitButton =
    document.getElementById("authSubmit");

  if (isLoading) {

    body.classList.add("auth-loading");

    body.classList.remove("auth-locked");
    body.classList.remove("auth-ready");

    if (gate) {
      gate.classList.add("is-open");
    }

    if (loading) {
      loading.hidden = false;
    }

    if (login) {
      login.hidden = true;
    }

    return;
  }


  body.classList.remove("auth-loading");

  if (loading) {
    loading.hidden = true;
  }

  if (submitButton) {
    submitButton.disabled = false;
  }

}


/* =========================================================
   SHOW LOGIN
========================================================= */

function showLogin() {

  const gate = getAuthGate();

  const login = getAuthLogin();

  const emailInput =
    document.getElementById("authEmail");

  const passwordInput =
    document.getElementById("authPassword");


  setAuthLoading(false);


  document.body.classList.add("auth-locked");

  document.body.classList.remove(
    "auth-ready"
  );


  if (gate) {
    gate.classList.add("is-open");

    gate.setAttribute(
      "aria-hidden",
      "false"
    );
  }


  if (login) {
    login.hidden = false;
  }


  setAuthMessage("");


  /*
      Don't automatically focus the password.
      Start with email so keyboard users
      have a natural entry point.
  */
  if (emailInput) {
    setTimeout(() => {
      emailInput.focus();
    }, 80);
  }

}


/* =========================================================
   HIDE LOGIN
========================================================= */

function hideLogin() {

  const gate = getAuthGate();

  const login = getAuthLogin();


  document.body.classList.remove(
    "auth-locked"
  );

  document.body.classList.add(
    "auth-ready"
  );


  if (login) {
    login.hidden = true;
  }


  if (gate) {

    gate.classList.remove(
      "is-open"
    );

    gate.setAttribute(
      "aria-hidden",
      "true"
    );

  }

}


/* =========================================================
   SIGN IN
========================================================= */

async function signInToOurPlace(event) {

  event.preventDefault();


  const supabase =
    window.ourPlaceSupabase;


  if (!supabase) {

    setAuthMessage(
      "The archive connection is not ready yet. Please refresh the page."
    );

    return;

  }


  const emailInput =
    document.getElementById(
      "authEmail"
    );

  const passwordInput =
    document.getElementById(
      "authPassword"
    );

  const submitButton =
    document.getElementById(
      "authSubmit"
    );


  const email =
    emailInput.value.trim();

  const password =
    passwordInput.value;


  if (!email) {

    setAuthMessage(
      "Please enter your email address."
    );

    emailInput.focus();

    return;

  }


  if (!password) {

    setAuthMessage(
      "Please enter your password."
    );

    passwordInput.focus();

    return;

  }


  submitButton.disabled = true;

  setAuthMessage("");


  submitButton.classList.add(
    "is-loading"
  );


  const {
    data,
    error
  } =
    await supabase.auth.signInWithPassword({
      email,
      password
    });


  submitButton.classList.remove(
    "is-loading"
  );


  if (error) {

    submitButton.disabled = false;

    setAuthMessage(
      "That email or password isn't correct."
    );

    passwordInput.select();

    return;

  }


  /*
      signInWithPassword successfully
      created/retrieved the authenticated session.
  */
  window.ourPlaceCurrentUser =
    data.user;


  passwordInput.value = "";

  hideLogin();

}


/* =========================================================
   AUTH STATE
========================================================= */

async function initializeOurPlaceAuth() {

  const supabase =
    window.ourPlaceSupabase;


  if (!supabase) {

    setAuthLoading(false);

    showLogin();

    setAuthMessage(
      "Our Place could not connect to Supabase."
    );

    return;

  }


  setAuthLoading(true);


  /*
      Check whether a session already exists.
  */
  const {
    data,
    error
  } =
    await supabase.auth.getSession();


  if (error) {

    console.error(
      "Our Place: could not read auth session.",
      error
    );

    showLogin();

    setAuthMessage(
      "We couldn't check your session. Please try again."
    );

    return;

  }


  if (data.session) {

    window.ourPlaceCurrentUser =
      data.session.user;


    hideLogin();

  } else {

    showLogin();

  }


  /*
      Keep the UI synchronized with
      future authentication changes.
  */
  supabase.auth.onAuthStateChange(
    (event, session) => {

      if (
        event === "SIGNED_IN" &&
        session
      ) {

        window.ourPlaceCurrentUser =
          session.user;

        hideLogin();

      }


      if (
        event === "SIGNED_OUT"
      ) {

        window.ourPlaceCurrentUser =
          null;

        showLogin();

      }

    }
  );

}


/* =========================================================
   START
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const form =
      document.getElementById(
        "authForm"
      );


    if (form) {

      form.addEventListener(
        "submit",
        signInToOurPlace
      );

    }


    initializeOurPlaceAuth();

  }
);