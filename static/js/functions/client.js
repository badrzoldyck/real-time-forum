const creatPost = `
<form class="post-form" id="postForm">
  <h2>Create New Post</h2>
  <div class="form-group">
    <label for="postTitle">Title</label>
    <input type="text" id="postTitle" name="title" required />
  </div>
  <div class="form-group">
    <label for="postContent">Content</label>
    <textarea id="postContent" name="content" required></textarea>
  </div>
  <div class="form-group">
    <label>Categories:</label>
    <div class="category-checkboxes">
      <label><input type="checkbox" name="category" value="Technology" /> Technology</label>
      <label><input type="checkbox" name="category" value="Lifestyle" /> Lifestyle</label>
      <label><input type="checkbox" name="category" value="Travel" /> Travel</label>
      <label><input type="checkbox" name="category" value="Food" /> Food</label>
      <label><input type="checkbox" name="category" value="Other" /> Other</label>
    </div>
  </div>
  <button type="submit">Create Post</button>
</form>

<!-- Filters -->
<div class="filter-container">
  <label for="categoryFilter">Filter by Category:</label>
  <select id="categoryFilter">
    <option value="all">All Posts</option>
  </select>
</div>

<div class="filter-container" id="ownershipFilterContainer">
  <label for="ownershipFilter">Filter by Posts:</label>
  <select id="ownershipFilter">
    <option value="all">All Posts</option>
    <option value="my_posts">My Posts</option>
    <option value="liked_posts">Liked Posts</option>
  </select>
</div>

<div id="allPosts"></div>
<button id="loadMoreBtn">Load More</button>
`;

const loginBtn = document.getElementById("loginToggle");
const logoutButton = document.getElementById("logoutButton");
const container = document.getElementById("container");
const chat = document.getElementById("chatapp");

let currentIndex = 0;
let postsPerPage = 5;
let selectedCategory = null;
let selectedOwnership = null;
let allPosts = [];

function clientPage() {
  container.innerHTML = "";
  container.style.display = "none"
  loginBtn.style.display = "none";
  logoutButton.style.display = "block";
  chat.style.display = "block";
  document.getElementById("container1").style.display = "block";
  document.getElementById("container1").innerHTML = creatPost;

  loadPosts();
  initForm();
}

// Initialize form submission
function initForm() {
  const form = document.getElementById("postForm");
  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const selectedCategories = document.querySelectorAll('input[name="category"]:checked');
    if (selectedCategories.length === 0) {
      alert("Please select at least one category.");
      return;
    }

    const formData = new FormData(form);
    let categories = [];
    selectedCategories.forEach((checkbox) => categories.push(checkbox.value));
    formData.append("categories", JSON.stringify(categories));

    try {
      const response = await fetch("/post_submit", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "An unknown error occurred.");
      }

      alert("Post submitted successfully!");
      form.reset();
      loadPosts();
    } catch (error) {
      console.error("Error:", error);
      alert(error.message || "An error occurred while submitting the post.");
    }
  });
}

// Load posts with filtering
async function loadPosts() {
  try {
    const params = new URLSearchParams();

    if (selectedCategory && selectedCategory !== "all") {
      params.append("category", selectedCategory);
    }

    if (selectedOwnership && selectedOwnership !== "all") {
      params.append("ownership", selectedOwnership);
    }

    const response = await fetch(`/show_posts?${params.toString()}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch data");
    }

    allPosts = await response.json();

    const allPostsContainer = document.getElementById("allPosts");
    if (!allPostsContainer) {
      console.error("Element with id 'allPosts' not found!");
      return;
    }

    allPostsContainer.innerHTML = "";
    currentIndex = 0;
    loadMorePosts();
  } catch (error) {
    console.error("Error loading posts:", error);
    alert("Failed to load posts: " + error.message);
  }
}

// Load more posts when scrolling
function loadMorePosts() {
  const allPostsContainer = document.getElementById("allPosts");
  const loadMoreBtn = document.getElementById("loadMoreBtn");

  for (let i = currentIndex; i < currentIndex + postsPerPage && i < allPosts.length; i++) {
    try {
      const postElement = createPostElement(allPosts[i]);
      allPostsContainer.appendChild(postElement);
    } catch (err) {
      console.error("Error creating post element:", err, allPosts[i]);
    }
  }

  currentIndex += postsPerPage;
  loadMoreBtn.style.display = currentIndex >= allPosts.length ? "none" : "block";
}

// Create post elements
function createPostElement(postData) {
  const postDiv = document.createElement("div");
  postDiv.classList.add("post");

  const commentCount = Array.isArray(postData.Comments) ? postData.Comments.length : 0;

  postDiv.innerHTML = `
      <h2 class="post-title">${postData.Title}</h2>
      <div class="post-categories">${postData.Categories.map(cat => `<span class="category-tag">${cat}</span>`).join("")}</div>
      <div class="post-content">${postData.Content}</div>
      <div class="stats">${postData.LikeCount} likes · ${postData.DislikeCount} dislikes· Comments (${commentCount})</div>
      <div class="interaction-bar">
        <button id="post-like-btn-${postData.PostID}" class="interaction-button ${postData.IsLike === 1 ? "active" : ""}" onclick="submitLikeDislike({ postID: '${postData.PostID}', isLike: true })">👍 Like</button>
        <button id="post-dislike-btn-${postData.PostID}" class="interaction-button ${postData.IsLike === 2 ? "active" : ""}" onclick="submitLikeDislike({ postID: '${postData.PostID}', isLike: false })">👎 Dislike</button>
      </div>
    `;
  return postDiv;
}


export { clientPage, loadPosts };
