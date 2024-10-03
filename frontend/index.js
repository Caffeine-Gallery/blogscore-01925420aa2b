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
    mainContent.innerHTML = '<p>Please log in to access this feature.</p><button id="loginBtn">Log In</button>';
    document.getElementById('loginBtn').addEventListener('click', login);
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
          <button class="viewPostBtn" data-postid="${post.id}">View Post</button>
        </div>
      `).join('');
      
      document.querySelectorAll('.viewPostBtn').forEach(button => {
        button.addEventListener('click', (e) => viewPost(e.target.dataset.postid));
      });
    }
  } catch (error) {
    postList.innerHTML = 'Error fetching posts: ' + error.message;
    console.error('Error fetching posts:', error);
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
        <button id="editProfileBtn">Edit Profile</button>
        <h3>My Posts</h3>
        <div id="userPosts"></div>
      `;
      document.getElementById('editProfileBtn').addEventListener('click', editProfile);
      fetchAndDisplayUserPosts();
    } else {
      mainContent.innerHTML = `
        <h2>Create Profile</h2>
        <input id="username" placeholder="Username">
        <textarea id="bio" placeholder="Bio"></textarea>
        <button id="createProfileBtn">Create Profile</button>
      `;
      document.getElementById('createProfileBtn').addEventListener('click', createProfile);
    }
  } catch (error) {
    mainContent.innerHTML = 'Error fetching profile: ' + error.message;
    console.error('Error fetching profile:', error);
  }
}

async function createProfile() {
  if (!await checkAuthentication()) return;

  const username = document.getElementById('username').value;
  const bio = document.getElementById('bio').value;
  try {
    await backend.createProfile(username, bio);
    displayProfile();
  } catch (error) {
    alert('Error creating profile: ' + error.message);
    console.error('Error creating profile:', error);
  }
}

async function editProfile() {
  if (!await checkAuthentication()) return;

  const mainContent = document.getElementById('mainContent');
  try {
    const profile = await backend.getProfile(currentUser);
    mainContent.innerHTML = `
      <h2>Edit Profile</h2>
      <input id="username" value="${profile.username}" disabled>
      <textarea id="bio">${profile.bio}</textarea>
      <button id="updateProfileBtn">Update Profile</button>
    `;
    document.getElementById('updateProfileBtn').addEventListener('click', updateProfile);
  } catch (error) {
    mainContent.innerHTML = 'Error loading profile for editing: ' + error.message;
    console.error('Error loading profile for editing:', error);
  }
}

async function updateProfile() {
  if (!await checkAuthentication()) return;

  const bio = document.getElementById('bio').value;
  try {
    await backend.updateBio(bio);
    displayProfile();
  } catch (error) {
    alert('Error updating profile: ' + error.message);
    console.error('Error updating profile:', error);
  }
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
          <button class="viewPostBtn" data-postid="${post.id}">View Post</button>
        </div>
      `).join('');
      
      document.querySelectorAll('.viewPostBtn').forEach(button => {
        button.addEventListener('click', (e) => viewPost(e.target.dataset.postid));
      });
    }
  } catch (error) {
    userPosts.innerHTML = 'Error fetching posts: ' + error.message;
    console.error('Error fetching user posts:', error);
  }
}

function displayCreatePost() {
  if (!checkAuthentication()) return;

  const mainContent = document.getElementById('mainContent');
  mainContent.innerHTML = `
    <h2>Create New Post</h2>
    <input id="postTitle" placeholder="Title">
    <textarea id="postContent" placeholder="Content"></textarea>
    <button id="submitPostBtn">Create Post</button>
  `;
  document.getElementById('submitPostBtn').addEventListener('click', createPost);
}

async function createPost() {
  if (!await checkAuthentication()) return;

  const title = document.getElementById('postTitle').value;
  const content = document.getElementById('postContent').value;

  if (!title.trim() || !content.trim()) {
    alert('Please enter both title and content for your post.');
    return;
  }

  try {
    console.log('Creating post with title:', title, 'and content:', content);
    const result = await backend.createPost(title, content);
    console.log('Post created successfully:', result);
    alert('Post created successfully!');
    displayHome();
  } catch (error) {
    alert('Error creating post: ' + error.message);
    console.error('Error creating post:', error);
  }
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
      <button id="submitRatingBtn">Submit Rating</button>
    `;
    document.getElementById('submitRatingBtn').addEventListener('click', () => ratePost(postId));
  } catch (error) {
    mainContent.innerHTML = 'Error fetching post: ' + error.message;
    console.error('Error fetching post:', error);
  }
}

async function ratePost(postId) {
  if (!await checkAuthentication()) return;

  const ratingValue = document.getElementById('ratingInput').value;
  if (!ratingValue || isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
    alert('Please enter a valid rating between 1 and 5.');
    return;
  }

  try {
    await backend.ratePost(postId, Number(ratingValue));
    alert('Rating submitted successfully!');
    viewPost(postId);
  } catch (error) {
    alert('Error rating post: ' + error.message);
    console.error('Error rating post:', error);
  }
}

document.getElementById('homeBtn').addEventListener('click', displayHome);
document.getElementById('profileBtn').addEventListener('click', displayProfile);
document.getElementById('createPostBtn').addEventListener('click', displayCreatePost);

init();
