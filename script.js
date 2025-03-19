// Store users data
let users = [];

// Load existing users from JSON file (if any)
fetch('users.json')
    .then(response => response.json())
    .then(data => {
        users = data;
    })
    .catch(err => console.log('No existing users found'));

// Add these global variables at the top
let currentPage = 1;
let isLoading = false;
let hasMore = true;
let currentSearchQuery = '';

// Sign Up Form Handler
document.getElementById('signupForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('signupUsername').value;
    const password = document.getElementById('signupPassword').value;
    const email = document.getElementById('signupEmail').value;
    const dob = document.getElementById('signupDOB').value;
    
    // Calculate age
    const age = calculateAge(dob);
    
    // Generate unique ID
    const id = Date.now().toString();
    
    const newUser = {
        id,
        username,
        password,
        email,
        dob,
        age
    };
    
    users.push(newUser);
    
    // Save to users.json (In a real application, this would be handled by a backend)
    // For this demo, we'll just log the users array
    console.log('Users:', users);
    alert('Sign up successful! Please login.');
});

// Login Form Handler
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        // Reset pagination variables
        currentPage = 1;
        hasMore = true;
        currentSearchQuery = 'Software Developer'; // Default search
        
        // Clear any existing search
        document.getElementById('searchInput').value = '';
        
        // Hide login/signup forms
        document.querySelector('.right-section').style.display = 'none';
        // Show job listings
        document.getElementById('jobListings').style.display = 'block';
        // Fetch and display jobs
        fetchJobs(currentSearchQuery);
    } else {
        alert('Invalid credentials!');
    }
});

// Calculate age function
function calculateAge(dob) {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
}

// Update the search button event listener
document.getElementById('searchButton').addEventListener('click', performSearch);

// Update the search input event listener
document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        performSearch();
    }
});

// Add this new function to handle search
function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchQuery = searchInput.value.trim();
    
    if (searchQuery.length > 0) {
        // Reset pagination when starting new search
        currentPage = 1;
        hasMore = true;
        currentSearchQuery = searchQuery;
        document.getElementById('jobCards').innerHTML = ''; // Clear existing jobs
        
        // Update page title to show current search
        document.querySelector('.jobs-nav h2').textContent = `Jobs matching "${searchQuery}"`;
        
        fetchJobs(searchQuery);
    } else {
        // Show error if search box is empty
        alert('Please enter a search term');
        searchInput.focus();
    }
}

// Add infinite scroll listener
document.querySelector('.job-listings').addEventListener('scroll', function(e) {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    
    // Check if we're near the bottom (within 100px)
    if (scrollHeight - scrollTop <= clientHeight + 100) {
        if (!isLoading && hasMore) {
            currentPage++;
            fetchJobs(currentSearchQuery);
        }
    }
});

// Update fetchJobs function
async function fetchJobs(searchQuery = 'Software Developer') {
    if (isLoading || !hasMore) return;
    
    isLoading = true;
    const loadingIndicator = document.getElementById('loadingIndicator');
    loadingIndicator.style.display = 'block';

    // Update the heading based on whether it's a search or default view
    const heading = document.querySelector('.jobs-nav h2');
    heading.textContent = searchQuery === 'Software Developer' ? 
        'Available Jobs' : 
        `Jobs matching "${searchQuery}"`;

    const options = {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': '4833eb41c6msh9ff06245cf0068ep1ad413jsn91f455a42cf5',
            'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
        }
    };

    try {
        const response = await fetch(
            `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(searchQuery)}&page=${currentPage}&num_pages=1`,
            options
        );
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
            displayJobs(data.data, currentPage === 1);
        } else {
            hasMore = false;
            if (currentPage === 1) {
                document.getElementById('jobCards').innerHTML = `
                    <div class="no-jobs">
                        <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 1rem; color: #94a3b8;"></i>
                        <p>No jobs found for "${searchQuery}"</p>
                        <p style="font-size: 0.9rem; margin-top: 0.5rem;">Try different keywords or broader search terms</p>
                    </div>`;
            }
        }
    } catch (error) {
        console.error('Error fetching jobs:', error);
        document.getElementById('jobCards').innerHTML = `
            <div class="no-jobs">
                <i class="fas fa-exclamation-circle" style="font-size: 2rem; margin-bottom: 1rem; color: #ef4444;"></i>
                <p>Error loading jobs. Please try again later.</p>
            </div>`;
        hasMore = false;
    } finally {
        isLoading = false;
        loadingIndicator.style.display = 'none';
    }
}

// Update displayJobs function
function displayJobs(jobs, isNewSearch = false) {
    const jobCards = document.getElementById('jobCards');
    
    if (isNewSearch) {
        jobCards.innerHTML = '';
    }

    if (!Array.isArray(jobs) || jobs.length === 0) {
        if (isNewSearch) {
            jobCards.innerHTML = '<div class="no-jobs">No jobs found</div>';
        }
        hasMore = false;
        return;
    }

    jobs.forEach(job => {
        const card = document.createElement('div');
        card.className = 'job-card';
        card.innerHTML = `
            <h3>${job.job_title || job.title}</h3>
            <p><i class="fas fa-building"></i> ${job.employer_name || 'Company not specified'}</p>
            <p><i class="fas fa-map-marker-alt"></i> ${job.job_city || job.job_country || 'Location not specified'}</p>
            <p><i class="fas fa-briefcase"></i> ${job.job_employment_type || 'Type not specified'}</p>
            ${job.job_description ? `
                <p class="job-description"><i class="fas fa-info-circle"></i> ${job.job_description.slice(0, 100)}...</p>
            ` : ''}
            <p><i class="fas fa-clock"></i> ${new Date(job.job_posted_at_timestamp * 1000).toLocaleDateString()}</p>
            <a href="${job.job_apply_link || '#'}" target="_blank" class="apply-btn">
                Apply Now <i class="fas fa-external-link-alt"></i>
            </a>
        `;
        jobCards.appendChild(card);
    });
}

// Add these event listeners at the top level of your script
document.getElementById('backButton').addEventListener('click', function() {
    // Clear search and return to default jobs listing
    document.getElementById('searchInput').value = '';
    currentPage = 1;
    hasMore = true;
    currentSearchQuery = 'Software Developer'; // Default search term
    document.getElementById('jobCards').innerHTML = '';
    fetchJobs(currentSearchQuery);
});

document.getElementById('logoutButton').addEventListener('click', function() {
    // Reset all states
    currentPage = 1;
    hasMore = true;
    currentSearchQuery = '';
    document.getElementById('searchInput').value = '';
    document.getElementById('jobCards').innerHTML = '';
    
    // Hide job listings and show login form
    document.getElementById('jobListings').style.display = 'none';
    document.querySelector('.right-section').style.display = 'flex';
    
    // Clear login form
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
}); 