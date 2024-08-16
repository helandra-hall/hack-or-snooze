"use strict";

/******************************************************************************
 * Handling navbar clicks and updating navbar
 */

/** Show main list of all stories when click site name */

function navAllStories(evt) {
  console.debug("navAllStories", evt);
  hidePageComponents();
  putStoriesOnPage();
}

$body.on("click", "#nav-all", navAllStories);

/** Show login/signup on click on "login" */

function navLoginClick(evt) {
  console.debug("navLoginClick", evt);
  hidePageComponents();
  $loginForm.show();
  $signupForm.show();
}

$navLogin.on("click", navLoginClick);

/** When a user first logins in, update the navbar to reflect that. */

function updateNavOnLogin() {
  console.debug("updateNavOnLogin");
  $(".main-nav-links").show();
  $navLogin.hide();
  $navLogOut.show();
  $navUserProfile.text(`${currentUser.username}`).show();
}

// Show user the submit form on click
function navSubmitClick(evt){
  evt.preventDefault();
  console.debug("navSubmitClick");
  $storyForm.show();
}

$body.on("click", "#nav-submit", navSubmitClick);

/** Shows the user's favorite stories */
function navShowFavorites(){
  $allStoriesList.hide();
  showUserFavoriteList();
  $favoriteStories.show();
}

$body.on("click", "#nav-favorite", navShowFavorites);