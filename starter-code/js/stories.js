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

function generateStoryMarkup(story) {
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();

  const userStars = Boolean(currentUser);
  return $(`
      <li id="${story.storyId}">
      ${userStars ? starStatus(story, currentUser): ""}
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}

/** Checks the user's favorite list and updates the star */

function starStatus(story, user) {
  const marked = user.checkFavoriteStatus(story) ? true : false
  if(marked){
    return '<span class="story-marked star"></span>'
  }
  else{
    return '<span class="story-unmarked star"></span>'
  }
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

/** Adds story to StoryList. */

async function submitNewStory(evt){
  console.debug("submitNewStory");
  evt.preventDefault;

// Creates an object with the title, author and url

  const storyTitle = $("#story-title").val();
  const storyAuthor = $("#story-author").val();
  const storyUrl = $("#story-url").val();
    
 //Creates a new Story object
   const newStoryObj = await storyList.addStory(currentUser, {
      title: storyTitle,
      author: storyAuthor,
      url: storyUrl,
    });

 // Adds to StoryList
 const newStory = generateStoryMarkup(newStoryObj);
 console.log(newStory);
 $allStoriesList.prepend(newStory);

 $storyForm.trigger("reset");
}

$storyForm.on("submit", submitNewStory);



async function showUserFavoriteList(){
  $favoriteStories.empty();
 for(let story of currentUser.favorites){
   const newStory = generateStoryMarkup(story);
  $favoriteStories.prepend(newStory); 
 }
};

async function toggleUserFavorites (e){
  const $star = $(e.target);
  const $starLi = $star.closest("li");
  const $starId = $starLi.attr("id");
  const $user = currentUser;
  const $story = storyList.stories.filter( val => val.storyId === $starId)[0];
   
  
  const $defaultStar = $star.hasClass( "story-unmarked" ) ? true: false;
  
  if($defaultStar){
    $star
      .removeClass( "story-unmarked" )
      .addClass( "story-marked" )
    $user.addFavorite($story);
  }
  else {
    $star
    .removeClass( "story-marked" )
    .addClass( "story-unmarked" )
    $user.removeFavorite($story);
  }

}

$allStoriesList.on("click", ".star", toggleUserFavorites);
$favoriteStories.on("click", ".star", toggleUserFavorites);