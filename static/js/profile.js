/*================ Modal Code ================*/
function openModal(modal){
    modal.style.display = 'block'
}

function closeModal(modal){
    modal.style.display = "none";
}
/*================ End Modal Code ================*/

function editProfile(event) {
    event.preventDefault();
    const id = document.getElementById("editId").value;
    const name = document.getElementById("editName").value;
    const email = document.getElementById("editEmail").value;
    const password = document.getElementById("editPassword").value;

    fetch(`/update-profile/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
    })
    .then(response => {
        if (response.ok) {
            alert(`Profile with ID ${id} updated successfully.`);
            location.reload();
        } else {
            alert(`Failed to update Profile with ID ${id}.`);
        }
    })
    .catch(error => console.error('Error:', error));
}