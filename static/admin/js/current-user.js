window.onload = async function() {
    const data_response = await fetch('/get-all-users');
    data = await data_response.json();
    // Add data to the table
    addDataToTable(data.users);
};

// Function to add rows to the table
function addDataToTable(data) {
    const tableBody = document.querySelector("#statementTable tbody");
    for (let i = 0; i < data.length; i++) {
        const row = document.createElement("tr");

        const idCell = document.createElement("td");
        idCell.textContent = data[i].id;
        idCell.setAttribute("data-label", "User ID");
        row.appendChild(idCell);
        
        const nameCell = document.createElement("td");
        nameCell.textContent = data[i].name;
        nameCell.setAttribute("data-label", "User Name");
        row.appendChild(nameCell);

        const emailCell = document.createElement("td");
        emailCell.textContent = data[i].email;
        emailCell.setAttribute("data-label", "User Email");
        row.appendChild(emailCell);

        const passwordCell = document.createElement("td");
        passwordCell.textContent = data[i].password;
        passwordCell.setAttribute("data-label", "User Password");
        row.appendChild(passwordCell);
        
        const totalQuizesCell = document.createElement("td");
        totalQuizesCell.textContent = data[i].total_quizes;
        totalQuizesCell.setAttribute("data-label", "User Password");
        row.appendChild(totalQuizesCell);

        const actionCell = document.createElement("td");
        actionCell.setAttribute("data-label", "Action");
        actionCell.className = "actionCell";

        const editButton = document.createElement("button");
        editButton.className = "btn btn-yes";
        editButton.innerHTML = '<i class="fas fa-edit"></i> Edit User';
        editButton.addEventListener("click", () => {
            openModal(document.getElementById('editModal'));
            setEditModalData(data[i]);
        });

        const deleteButton = document.createElement("button");
        deleteButton.className = "btn btn-no";
        deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i> Delete User';
        deleteButton.addEventListener("click", () => {
            document.getElementById("userId").value = data[i].id;
            openModal(document.getElementById('confirmModal'));
        });

        actionCell.appendChild(editButton);
        actionCell.appendChild(deleteButton);

        row.appendChild(actionCell);

        tableBody.appendChild(row);
    }
}

/*================ Edit Modal Code ================*/
function setEditModalData(user) {
    document.getElementById("editName").value = user.name;
    document.getElementById("editEmail").value = user.email;
    document.getElementById("editPassword").value = user.password;
    document.getElementById("editId").value = user.id;
}

function editUser(event) {
    event.preventDefault();
    const id = document.getElementById("editId").value;
    const name = document.getElementById("editName").value;
    const email = document.getElementById("editEmail").value;
    const password = document.getElementById("editPassword").value;

    fetch(`/update-user/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
    })
    .then(response => {
        if (response.ok) {
            alert(`User with ID ${id} updated successfully.`);
            location.reload();
        } else {
            alert(`Failed to update user with ID ${id}.`);
        }
    })
    .catch(error => console.error('Error:', error));
}
/*============== End Edit Modal Code ================*/

/*================ Confirm Modal Code ================*/
function deleteUser(event) {
    event.preventDefault();
    const form = event.target;
    const userId = form.querySelector('input[name="userId"]').value;
    fetch(`/delete-user/${userId}`, { method: 'DELETE' })
        .then(response => {
            if (response.ok) {
                alert(`User with ID ${userId} deleted successfully.`);
                location.reload(); 
            } else {
                alert(`Failed to delete user with ID ${userId}.`);
            }
        })
        .catch(error => console.error('Error:', error));
}
/*============== End Delete Modal Code ================*/

/*================ Add User Code ================*/
function addUser(event) {
    event.preventDefault();
    const name = document.getElementById("userName").value;
    const email = document.getElementById("userEmail").value;
    const password = document.getElementById("userPassword").value;
    fetch('/add-user', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('User added successfully');
            location.reload();
        } else {
            alert('Failed to add user', data.error);
        }
    })
    .catch(error => console.error('Error:', error));
}
/*============== End Modal Code ================*/

/*================ Modal Code ================*/
function openModal(modal){
    modal.style.display = 'block'
}

function closeModal(modal){
    modal.style.display = "none";
}
/*================ End Modal Code ================*/