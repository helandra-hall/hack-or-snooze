"use strict";

// global to hold the User instance of the currently-logged-in user
let currentUser;

/******************************************************************************
 * User login/signup/login
 */

/** Handle login form submission. If login ok, sets up the user instance */

async function login(evt) {
  console.debug("login", evt);
  evt.preventDefault();

  // grab the username and password
  const username = $("#login-username").val();
  const password = $("#login-password").val();

  // User.login retrieves user info from API and returns User instance
  // which we'll make the globally-available, logged-in user.
  currentUser = await User.login(username, password);

  if (currentUser === undefined) {
    hidePageComponents();
    $loginForm.show();
    $signupForm.show();
    return;
  }

  $loginForm.trigger("reset");

  saveUserCredentialsInLocalStorage();
  updateUIOnUserLogin();
}

$loginForm.on("submit", login);

/** Handle signup form submission. */

async function signup(evt) {
  console.debug("signup", evt);
  evt.preventDefault();

  const name = $("#signup-name").val();
  const username = $("#signup-username").val();
  const password = $("#signup-password").val();

  // User.signup retrieves user info from API and returns User instance
  // which we'll make the globally-available, logged-in user.
  currentUser = await User.signup(username, password, name);

  if (currentUser === undefined) {
    hidePageComponents();
    $loginForm.show();
    $signupForm.show();
    return;
  }
  saveUserCredentialsInLocalStorage();
  updateUIOnUserLogin();

  $signupForm.trigger("reset");
}

$signupForm.on("submit", signup);

/** Handle click of logout button
 *
 * Remove their credentials from localStorage and refresh page
 */

function logout(evt) {
  console.debug("logout", evt);

  localStorage.clear();
  location.reload();
}

$navLogOut.on("click", logout);

/******************************************************************************
 * Storing/recalling previously-logged-in-user with localStorage
 */

/** If there are user credentials in local storage, use those to log in
 * that user. This is meant to be called on page load, just once.
 */

async function checkForRememberedUser() {
  console.debug("checkForRememberedUser");
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");
  if (!token || !username) return false;

  // try to log in with these credentials (will be null if login failed)
  currentUser = await User.loginViaStoredCredentials(token, username);
}

/** Sync current user information to localStorage.
 *
 * We store the username/token in localStorage so when the page is refreshed
 * (or the user revisits the site later), they will still be logged in.
 */

function saveUserCredentialsInLocalStorage() {
  console.debug("saveUserCredentialsInLocalStorage");
  if (currentUser) {
    localStorage.setItem("token", currentUser.loginToken);
    localStorage.setItem("username", currentUser.username);
  }
}

/******************************************************************************
 * General UI stuff about users
 */

/** When a user signs up or registers, we want to set up the UI for them:
 *
 * - show the stories list
 * - update nav bar options for logged-in user
 * - generate the user profile part of the page
 */

function updateUIOnUserLogin() {
  console.debug("updateUIOnUserLogin");

  $allStoriesList.show();
  $loginForm.hide();
  $signupForm.hide();
  updateNavOnLogin();
  addUserProfileInfo();
}

function addUserProfileInfo() {
  const $name = $("#user-name").find("span")[0];
  const $userName = $("#user-username").find("span")[0];
  const $dateCreated = $("#user-dateCreation").find("span")[0];

  $($name).text(`${currentUser.name}`);
  $($userName).text(`${currentUser.username}`);
  $($dateCreated).text(`${currentUser.createdAt.slice(0, 10)}`);
 
}

$("#updateButton").on("click", function () {
  $("#updatedName").val(`${currentUser.name}`);
   $("#userInfoChange").slideDown();
});

$("#cancelUserEditsBtn").on("click", function(){
  $("#userInfoChange").slideUp();

})

$("#userInfoChange").on("submit", updateUserProfile);

function updateUserProfile(e) {
  e.preventDefault;
  $("#userInfoChange").slideUp();
  $userProfile.hide();
  const $newName = $("#updatedName").val();
  const $changedPassword = $("#updatedPassword").val();
  const userData = {
    name: $newName,
    password: $changedPassword,
  };
if(userData.password.length === 0){
  delete userData.password;
}
currentUser.editUserInformation(currentUser, userData);
  
  alert("Your information has been updated.");
  $allStoriesList.show();
}

$("#deleteAccountBtn").on("click", deleteUserAccount());
function deleteUserAccount(){
  if(window.confirm("Are you sure you want to delete your account?")){
    currentUser.deleteUser(currentUser);
    logout();
  }
}
