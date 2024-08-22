"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story, userStory, storyDelete) {
  // console.debug("generateStoryMarkup", story);

 
  const userStars = Boolean(currentUser);
  //storyDelete = Boolean(currentUser);

  //if($ownStories.is(":hidden")){ userStory = false;storyDelete = false;   };

  return $(`
      <li id="${story.storyId}">
      ${storyDelete ? addRemoveButton(story, currentUser) : " "}
      ${userStars ? starStatus(story, currentUser) : ""}
         <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${story.getHostName()})</small>
        ${userStory ? userStoryEdit() : ""}
         <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
        <hr>
      </li>
      `);
}
//
/** Checks the user's favorite list and updates the star */

function starStatus(story, user) {
  const marked = user.checkFavoriteStatus(story) ? true : false;
  if (marked) {
    return '<span class="story-marked star"></span>';
  } else {
    return '<span class="story-unmarked star"></span>';
  }
}

function addRemoveButton(story, user) {
  //if user has story in own stories array, add remove button
  const storyStatus = user.checkSubmittedStatus(story);
  if (storyStatus) return '<span class="removeButton"></span>';
  else {
    return '<span this.style.display = "none"></span>';
  }
}

function userStoryEdit() {
  return '<a id="story-edit" href="#"><small>(edit)</small></a> ';
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);

    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

function loadMoreStories(){
  if(window.scrollY + window.innerHeight >= document.documentElement.scrollHeight){
    for (let story of storyList.stories) {
      const $story = generateStoryMarkup(story);
  
      $allStoriesList.append($story);
    }
  }
}

/** Adds story to StoryList. */

async function submitNewStory(evt) {
  console.debug("submitNewStory");
  evt.preventDefault();

  const storyTitle = $("#story-title").val();
  const storyAuthor = $("#story-author").val();
  const storyUrl = $("#story-url").val();

  const newStoryObj = await storyList.addStory(currentUser, {
    title: storyTitle,
    author: storyAuthor,
    url: storyUrl,
  });

  
  const newStory = generateStoryMarkup(newStoryObj);
  currentUser.ownStories.append(newStory);
  $allStoriesList.prepend(newStory);
  $storyForm.trigger("reset");
  $storyForm.hide();
  $allStoriesList.show();
}

$storyForm.on("submit", submitNewStory);

async function removeStory(e) {
  e.preventDefault();
  const $story = $(e.target).closest("li").attr("id");
  let userToken = currentUser.loginToken;
  await axios({
    url: `${BASE_URL}/stories/${$story}`,
    method: "DELETE",
    data: { token: userToken },
  });

  storyList.stories = storyList.stories.filter(
    (value) => value.storyId !== $story
  );
  currentUser.ownStories = currentUser.ownStories.filter((value) => value.storyId !== $story);
  showUserSubmittedStories();
  if($ownStories[0].childElementCount === 0){putStoriesOnPage();};
}

/** Handles user submitted stories and user favorites */

async function showUserFavoriteList() {
  $favoriteStories.empty();
  if (currentUser.favorites.length === 0) {
    $favoriteStories.prepend("<h5>Your favorite list is currently empty.</h5>");
  } else {
    for (let story of currentUser.favorites) {
      const newStory = generateStoryMarkup(story);
      $favoriteStories.prepend(newStory);
    }
  }
}


async function toggleUserFavorites(e) {
  const $star = $(e.target);
  const $starId = $star.closest("li").attr("id");
  
  const $user = currentUser;
  const $story = storyList.stories.filter((val) => val.storyId === $starId)[0];

  const $defaultStar = $star.hasClass("story-unmarked") ? true : false;

  if ($defaultStar) {
    $star.removeClass("story-unmarked").addClass("story-marked");
    $user.addFavorite($story);
  } else {
    $star.removeClass("story-marked").addClass("story-unmarked");
    $user.removeFavorite($story);
  }
}

async function showUserSubmittedStories() {
  $ownStories.empty();
  let userStory = true;
  let storyDelete = true;
  if (currentUser.ownStories.length === 0) {
    $ownStories.append("<h5>You don't have any stories submitted yet.</h5>");
  } else {
    for (let story of currentUser.ownStories) {
      const newStory = generateStoryMarkup(story, userStory,storyDelete);
      $ownStories.prepend(newStory);
    }
  }
}

let userEditedStory
async function editUserStoryForm(e){

  $ownStories.hide();
const $storyID = $(e.target).closest("li").attr("id");
const $story = storyList.stories.filter((val) => val.storyId === $storyID)[0];
const $storyAuthor = $storyEditor.find("#edit-story-author")[0]
const $storyTitle = $storyEditor.find("#edit-story-title")[0]
const $storyurl = $storyEditor.find("#edit-story-url")[0]

$($storyAuthor).val($story.author);
$($storyTitle).val($story.title);
$($storyurl).val($story.url);

 $storyEditor.show();
userEditedStory = $story

};

async function updateUserStory(e){
  console.debug("updateUserStory");
  e.preventDefault()();
  $storyEditor.hide();
  const storyId = userEditedStory.storyId;
  const storyTitle = $("#edit-story-title").val();
  const storyAuthor = $("#edit-story-author").val();
  const storyUrl = $("#edit-story-url").val();

  
   await storyList.editStory(currentUser, storyId, {
    title: storyTitle,
    author: storyAuthor,
    url: storyUrl,
  });
  $allStoriesList.show();
}

$allStoriesList.on("click", ".star", toggleUserFavorites);
$favoriteStories.on("click", ".star", toggleUserFavorites);
$ownStories.on("click", ".removeButton", removeStory);
$ownStories.on("click", "#story-edit", editUserStoryForm);
$storyEditor.on("submit", updateUserStory);


