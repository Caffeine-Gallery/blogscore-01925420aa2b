import { backend } from 'declarations/backend';
import { AuthClient } from '@dfinity/auth-client';
import { Principal } from '@dfinity/principal';

let authClient;
let currentUser;

async function init() {
  authClient = await AuthClient.create();
  if (await authClient.isAuthenticated()) {
    handleAuthenticated();
  } else {
    await login();
  }
}

async function login() {
  await authClient.login({
    identityProvider: "https://identity.ic0.app/#authorize",
    onSuccess: handleAuthenticated,
  });
}

async function handleAuthenticated() {
  const identity = await authClient.getIdentity();
  currentUser = identity.getPrincipal();
  displayHome();
}

async function checkAuthentication() {
  if (!authClient || !await authClient.isAuthenticated()) {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = '<p>Please log in to access this feature.</p><button onclick="login()">Log In</button>';
    return false;
  }
  if (!currentUser) {
    const identity = await authClient.getIdentity();
    currentUser = identity.getPrincipal();
  }
  return true;
}

function displayHome() {
  const mainContent = document.getElementById('mainContent');
  mainContent.innerHTML = '<h2>Welcome to the Blog Platform</h2><div id="postList"></div>';
  fetchAndDisplayPosts();
}

async function fetchAndDisplayPosts() {
  if (!await checkAuthentication()) return;

  const postList = document.getElementById('postList');
  postList.innerHTML = 'Loading posts...';

  try {
    const posts = await backend.getUserPosts(currentUser);
    if (posts.length === 0) {
      postList.innerHTML = 'No posts yet. Create your first post!';
    } else {
      postList.innerHTML = posts.map(post => `
        <div class="post">
          <h3>${post.title}</h3>
          <p>${post.content.substring(0, 100)}...</p>
          <button onclick="viewPost(${post.id})">View Post</button>
        </div>
      `).join('');
    }
  } catch (error) {
    postList.innerHTML = 'Error fetching posts: ' + error.message;
  }
}

async function displayProfile() {
  if (!await checkAuthentication()) return;

  const mainContent = document.getElementById('mainContent');
  mainContent.innerHTML = 'Loading profile...';

  try {
    const profile = await backend.getProfile(currentUser);
    if (profile) {
      mainContent.innerHTML = `
        <h2>My Profile</h2>
        <p><strong>Username:</strong> ${profile.username}</p>
        <p><strong>Bio:</strong> ${profile.bio}</p>
        <button onclick="editProfile()">Edit Profile</button>
        <h3>My Posts</h3>
        <div id="userPosts"></div>
      `;
      fetchAndDisplayUserPosts();
    } else {
      mainContent.innerHTML = `
        <h2>Create Profile</h2>
        <input id="username" placeholder="Username">
        <textarea id="bio" placeholder="Bio"></textarea>
        <button onclick="createProfile()">Create Profile</button>
      `;
    }
  } catch (error) {
    mainContent.innerHTML = 'Error fetching profile: ' + error.message;
  }
}

async function createProfile() {
  if (!await checkAuthentication()) return;

  const username = document.getElementById('username').value;
  const bio = document.getElementById('bio').value;
  await backend.createProfile(username, bio);
  displayProfile();
}

async function editProfile() {
  if (!await checkAuthentication()) return;

  const mainContent = document.getElementById('mainContent');
  const profile = await backend.getProfile(currentUser);
  mainContent.innerHTML = `
    <h2>Edit Profile</h2>
    <input id="username" value="${profile.username}" disabled>
    <textarea id="bio">${profile.bio}</textarea>
    <button onclick="updateProfile()">Update Profile</button>
  `;
}

async function updateProfile() {
  if (!await checkAuthentication()) return;

  const bio = document.getElementById('bio').value;
  await backend.updateBio(bio);
  displayProfile();
}

async function fetchAndDisplayUserPosts() {
  if (!await checkAuthentication()) return;

  const userPosts = document.getElementById('userPosts');
  userPosts.innerHTML = 'Loading posts...';

  try {
    const posts = await backend.getUserPosts(currentUser);
    if (posts.length === 0) {
      userPosts.innerHTML = 'No posts yet.';
    } else {
      userPosts.innerHTML = posts.map(post => `
        <div class="post">
          <h4>${post.title}</h4>
          <p>${post.content.substring(0, 100)}...</p>
          <button onclick="viewPost(${post.id})">View Post</button>
        </div>
      `).join('');
    }
  } catch (error) {
    userPosts.innerHTML = 'Error fetching posts: ' + error.message;
  }
}

function displayCreatePost() {
  if (!checkAuthentication()) return;

  const mainContent = document.getElementById('mainContent');
  mainContent.innerHTML = `
    <h2>Create New Post</h2>
    <input id="postTitle" placeholder="Title">
    <textarea id="postContent" placeholder="Content"></textarea>
    <button onclick="createPost()">Create Post</button>
  `;
}

async function createPost() {
  if (!await checkAuthentication()) return;

  const title = document.getElementById('postTitle').value;
  const content = document.getElementById('postContent').value;
  await backend.createPost(title, content);
  displayHome();
}

async function viewPost(postId) {
  if (!await checkAuthentication()) return;

  const mainContent = document.getElementById('mainContent');
  mainContent.innerHTML = 'Loading post...';

  try {
    const post = await backend.getPost(postId);
    const ratings = await backend.getPostRatings(postId);
    const aggregatedRating = await backend.getAggregatedRating(postId);

    mainContent.innerHTML = `
      <h2>${post.title}</h2>
      <p>${post.content}</p>
      <p>Author: ${post.authorId}</p>
      <p>Created at: ${new Date(Number(post.createdAt) / 1000000).toLocaleString()}</p>
      <h3>Ratings</h3>
      <p>Average Rating: ${aggregatedRating ? aggregatedRating.toFixed(1) : 'No ratings yet'}</p>
      <input type="number" id="ratingInput" min="1" max="5" placeholder="Rate (1-5)">
      <button onclick="ratePost(${postId})">Submit Rating</button>
    `;
  } catch (error) {
    mainContent.innerHTML = 'Error fetching post: ' + error.message;
  }
}

async function ratePost(postId) {
  if (!await checkAuthentication()) return;

  const ratingValue = document.getElementById('ratingInput').value;
  await backend.ratePost(postId, Number(ratingValue));
  viewPost(postId);
}

document.getElementById('homeBtn').addEventListener('click', displayHome);
document.getElementById('profileBtn').addEventListener('click', displayProfile);
document.getElementById('createPostBtn').addEventListener('click', displayCreatePost);

init();
