"use strict";

const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

/******************************************************************************
 * Story: a single story in the system
 */

class Story {
  /** Make instance of Story from data object about story:
   *   - {title, author, url, username, storyId, createdAt}
   */

  constructor({ storyId, title, author, url, username, createdAt }) {
    this.storyId = storyId;
    this.title = title;
    this.author = author;
    this.url = url;
    this.username = username;
    this.createdAt = createdAt;
  }

  /** Parses hostname out of URL and returns it. */

  getHostName() {
   return new URL(this.url).hostname;
  
  }
}

/******************************************************************************
 * List of Story instances: used by UI to show story lists in DOM.
 */

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  /** Generate a new StoryList. It:
   *
   *  - calls the API
   *  - builds an array of Story instances
   *  - makes a single StoryList instance out of that
   *  - returns the StoryList instance.
   */

  static async getStories() {
    // Note presence of `static` keyword: this indicates that getStories is
    //  **not** an instance method. Rather, it is a method that is called on the
    //  class directly. Why doesn't it make sense for getStories to be an
    //  instance method?

    // query the /stories endpoint (no auth required)
    const response = await axios({
      url: `${BASE_URL}/stories`,
      method: "GET",
    });

    // turn plain old story objects from API into instances of Story class
    const stories = response.data.stories.map((story) => new Story(story));

    // build an instance of our own class using the new array of stories
    return new StoryList(stories);
  }

  /** Adds story data to API, makes a Story instance, adds it to story list.
   * - user - the current instance of User who will post the story
   * - obj of {title, author, url}
   *
   * Returns the new Story instance
   */

  async addStory(user, newStory) {
    const {data} = await axios({
      url: `${BASE_URL}/stories`,
      method: "POST",
      data: { token: user.loginToken, story: newStory },
    });

    return new Story(data.story);
    
  }

  async editStory(user, storyID, storyData) {
    await axios({
      url: `${BASE_URL}/stories/${storyID}`,
      method: "PATCH",
      data: { token: user.loginToken, story: storyData },
    });
  }
}

/******************************************************************************
 * User: a user in the system (only used to represent the current user)
 */

class User {
  /** Make user instance from obj of user data and a token:
   *   - {username, name, createdAt, favorites[], ownStories[]}
   *   - token
   */

  constructor(
    { username, name, createdAt, favorites = [], ownStories = [] },
    token
  ) {
    this.username = username;
    this.name = name;
    this.createdAt = createdAt;

    // instantiate Story instances for the user's favorites and ownStories
    this.favorites = favorites.map((s) => new Story(s));
    this.ownStories = ownStories.map((s) => new Story(s));

    // store the login token on the user so it's easy to find for API calls.
    this.loginToken = token;
  }

  /** Register new user in API, make User instance & return it.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */

  static async signup(username, password, name) {
    try {
      const response = await axios({
        url: `${BASE_URL}/signup`,
        method: "POST",
        data: { user: { username, password, name } },
      });

      let { user } = response.data;

      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          favorites: user.favorites,
          ownStories: user.stories,
        },
        response.data.token
      );
    } catch (err) {
      err.preventDefault();
      const errorStatus = err.response.data.error.status;
      const errorMessage = err.response.data.error.message;
      console.log(errorStatus);
      if (errorStatus) {
        alert(errorMessage);
      }
    }
  }

  /** Login in user with API, make User instance & return it.

   * - username: an existing user's username
   * - password: an existing user's password
   */

  static async login(username, password) {
    try {
      const response = await axios({
        url: `${BASE_URL}/login`,
        method: "POST",
        data: { user: { username, password } },
      });

      let { user } = response.data;

      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          favorites: user.favorites,
          ownStories: user.stories,
        },
        response.data.token
      );
    } catch (err) {
      err.preventDefault();
      const errorStatus = err.response.data.error.status;
      const errorMessage = err.response.data.error.message;

      if (errorStatus) {
        alert(errorMessage);
      }
    }
  }

  /** When we already have credentials (token & username) for a user,
   *   we can log them in automatically. This function does that.
   */

  static async loginViaStoredCredentials(token, username) {
    try {
      const response = await axios({
        url: `${BASE_URL}/users/${username}`,
        method: "GET",
        params: { token },
      });

      let { user } = response.data;

      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          favorites: user.favorites,
          ownStories: user.stories,
        },
        token
      );
    } catch (err) {
      console.error("loginViaStoredCredentials failed", err);
      return null;
    }
  }

  async addFavorite(story) {
    this.favorites.push(story);
    await this.changeFavoriteStatus(story, "add");
  }
  async removeFavorite(story) {
    this.favorites = this.favorites.filter(
      (value) => value.storyId !== story.storyId
    );
    showUserFavoriteList();
    await this.changeFavoriteStatus(story, "remove");
  }

  async changeFavoriteStatus(story, status) {
    const method = status === "add" ? "POST" : "DELETE";
    await axios({
      url: `${BASE_URL}/users/${this.username}/favorites/${story.storyId}`,
      method: method,
      data: { token: this.loginToken },
    });
  }

  checkFavoriteStatus(story) {
    return this.favorites.some((val) => val.storyId === story.storyId);
  }
  checkSubmittedStatus(story) {
    return this.ownStories.some((val) => val.storyId === story.storyId);
  }

  async editUserInformation(user, userData) {
    const response = await axios({
      url: `${BASE_URL}/users/${user.username}`,
      method: "PATCH",
      data: { token: user.loginToken, user: userData },
    });
  }

  async deleteUser(user) {
    try {
      await axios({
        url: `${BASE_URL}/users/${user.username}`,
        method: "PATCH",
        data: { token: user.loginToken },
      });
    } catch (err) {
      const errorStatus = err.response.data.error.status;
      const errorMessage = err.response.data.error.message;

      if (errorStatus) {
        alert(errorMessage);
      }
    }
  }
}
