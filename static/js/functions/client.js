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
    <option value="Technology">Technology Posts</option>
    <option value="Lifestyle">Lifestyle Posts</option>
    <option value="Travel">Travel Posts</option>
    <option value="Food">Food Posts</option>
    <option value="Other">Other Posts</option>
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
`
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
  document.getElementById("chat").innerHTML = "";
  document.getElementById("container1").style.display = "block";
  document.getElementById("container1").innerHTML = creatPost;


  document.getElementById("categoryFilter").addEventListener("change", function () {
    selectedCategory = this.value === "all" ? null : this.value; 
    selectedOwnership = this.value === null;
    const categoy = document.getElementById("ownershipFilter")
    categoy.value = "all";
    postsPerPage = 5;
    loadPosts(); 
    console.log("selectedCategory",selectedCategory);
  
  });
  
  document.getElementById("ownershipFilter").addEventListener("change", function () {
    selectedOwnership = this.value === "all" ? null : this.value; 
    selectedCategory = this.value === null;
    const categoy = document.getElementById("categoryFilter")
    categoy.value = "all";
    postsPerPage = 5;
    loadPosts(); 
    console.log("selectedOwnership",selectedOwnership);
    
  });

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
        alert(data.error || "An unknown error occurred.");
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
  <div class="post-categories">
    ${postData.Categories.map(
      (cat) => `<span class="category-tag">${cat}</span>`
    ).join("")}
  </div>
  <div class="post-content">${postData.Content}</div>
  <div class="stats">${postData.LikeCount} likes · ${
postData.DislikeCount
} dislikes· Comments (${commentCount})</div>
  <div class="interaction-bar">
    <button id="post-like-btn-${
      postData.PostID
    }" class="interaction-button ${postData.IsLike === 1 ? "active" : ""}"
      onclick="submitLikeDislike({ postID: '${
        postData.PostID
      }', isLike: true })">👍 Like</button>
    <button id="post-dislike-btn-${
      postData.PostID
    }" class="interaction-button ${postData.IsLike === 2 ? "active" : ""}"
      onclick="submitLikeDislike({ postID: '${
        postData.PostID
      }', isLike: false })">👎 Dislike</button>
    <button class="interaction-button comment-button" onclick="toggleComments('${
      postData.PostID
    }')">
      💬 Comments (${commentCount})
    </button>
  </div>
  <div class="comments-section" id="comments-${
    postData.PostID
  }" style="display: none;">
    <form class="comment-form"  style="display : block" id="commentForm-${
      postData.PostID
    }" onsubmit="submitComment(event, ${postData.PostID})">
      <input type="hidden" name="post_id" value="${postData.PostID}">
      <textarea placeholder="Write a comment..." name="comment" required></textarea>
      <button type="submit">Add Comment</button>
    </form>
    ${
      commentCount > 0
        ? postData.Comments.map(
            (comment) => `
    <div class="comment">
      <div class="comment-content">${comment.Content}</div>
      <div id="comment-like-btn-${
                comment.CommentID
              }" class="stats">${comment.LikeCount} likes · ${
              comment.DislikeCount
            } dislikes</div>
      <div class="interaction-bar">
              <button id="comment-like-btn-${
                comment.CommentID
              }" class="interaction-button ${
              comment.IsLike === 1 ? "active" : ""
            }"
      onclick="submitLikeDislike({ commentID: '${
        comment.CommentID
      }', isLike: true })">👍 Like</button>
    <button id="comment-dislike-btn-${
      comment.CommentID
    }" class="interaction-button ${comment.IsLike === 2 ? "active" : ""}"
      onclick="submitLikeDislike({ commentID: '${
        comment.CommentID
      }', isLike: false })">👎 Dislike</button>
            </div>
    </div>
  `
          ).join("")
        : "<p>No comments yet.</p>"
    }
  </div>
`;

  return postDiv;
}

function submitLikeDislike({ postID = null, commentID = null, isLike }) {
  console.log("likeBtn ID:", `like-btn-${commentID || postID}`);

  if (!postID && !commentID) {
    console.error("Either postID or commentID is required");
    return;
  }

  const likeBtnID = postID
    ? `post-like-btn-${postID}`
    : `comment-like-btn-${commentID}`;
  const dislikeBtnID = postID
    ? `post-dislike-btn-${postID}`
    : `comment-dislike-btn-${commentID}`;
  const likeBtn = document.getElementById(likeBtnID);
  const dislikeBtn = document.getElementById(dislikeBtnID);

  // Disable buttons to prevent rapid clicks
  likeBtn.disabled = true;
  dislikeBtn.disabled = true;

  try {
    const formData = new URLSearchParams();
    if (postID) formData.append("post_id", postID);
    if (commentID) formData.append("comment_id", commentID);

    if (isLike === true && likeBtn.classList.contains("active")) {
      isLike = null;
    } else if (isLike === false && dislikeBtn.classList.contains("active")) {
      isLike = null;
    }

    formData.append("is_like", isLike === null ? "" : isLike);

    fetch("/interact", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    })
      .then(response => response.json())
      .then(({ updatedIsLike }) => {
        toggleButtons(likeBtnID, dislikeBtnID, updatedIsLike);
        console.log(updatedIsLike);
        
        loadPosts();
        //toggleComments(postID)
       

      })
      .catch(error => {
        console.error("Error:", error);
        alert("Something went wrong. Please try again.");
      })
      .finally(() => {
        likeBtn.disabled = false;
        dislikeBtn.disabled = false;
      });

  } catch (error) {
    console.error("Error:", error);
  }
}

// Attach to global scope
window.submitLikeDislike = submitLikeDislike;


function toggleButtons(likeBtnID, dislikeBtnID, updatedIsLike) {
  const likeBtn = document.getElementById(likeBtnID);
  const dislikeBtn = document.getElementById(dislikeBtnID);
  if (updatedIsLike === true) {
    likeBtn.classList.add("active");
    dislikeBtn.classList.remove("active");
  } else if (updatedIsLike === false) {
    dislikeBtn.classList.add("active");
    likeBtn.classList.remove("active");
  } else {
    likeBtn.classList.remove("active");
    dislikeBtn.classList.remove("active");
  }
}

function toggleComments(postID) {
  const commentsSection = document.getElementById(`comments-${postID}`);
  commentsSection.style.display =
    commentsSection.style.display === "none" ? "block" : "none";
}

// Function to submit a comment
async function submitComment(event, postID) {
  event.preventDefault();

  const form = document.getElementById(`commentForm-${postID}`);
  const formData = new FormData(form);
  formData.append("post_id", postID);

  try {
    const response = await fetch("/comment_submit", {
      method: "POST",
      body: formData,
    });
    const result = await response.text();
    alert("Comment submitted successfully!");
    form.reset();
    loadPosts();
  } catch (error) {
    console.error("Error submitting comment:", error);
    alert("Failed to submit comment");
  }
}

window.toggleComments = toggleComments;

window.submitComment = submitComment;


// Export function if using modules
export { clientPage, loadPosts,};
