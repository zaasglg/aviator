<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>Authorization</title>
    <link rel="stylesheet" href="./css/reset.css?v=1.0">
    <link rel="stylesheet" href="./css/normalize.css?v=1.0">
    <link rel="stylesheet" href="./css/style.css?v=1.0">
    <link rel="icon" href="./images/authorization.png" />
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/notify/0.4.2/notify.min.js"></script>
</head>
<body style="background: #000;">

    <div class="main__wrapper">


        <div class="main">
        <a href="#" class="logo" style=" display: flex; justify-content: center; height: 180px;"><img src="./images/aviator-logo.png" alt /></a>  

        <br>
        <br>
            <form id="loginForm" style="display: flex; flex-direction: column; align-items: center; width: 100%;">
                <input class="translate-placeholder" data-key="input_id" style="margin-bottom: 10px;" type="text" name="account_id" id="account_id" placeholder="Input your account ID" required>
                <button style="background: #FFD900" class="btn translate" type="submit" data-key="sign_in">Sign in</button>
            </form>
            <p id="errorMessage" style="color: red; display: none;"></p>
            
             <script>
    $(document).ready(function() {
        $("#loginForm").submit(function(event) {
            event.preventDefault();

            let account_id = $("#account_id").val();

            let formData = new FormData();
            formData.append("account_id", account_id);

            fetch("login.php", {
                method: "POST",
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                console.log("Server response:", data); // DEBUG
                if (data.success) {
                    $.notify("Login successful!", "success");
                    setTimeout(() => window.location.href = "aviator.php", 1000);
                } else {
                    $.notify(data.message, "error");
                }
            })
            .catch(error => {
                console.error("Error:", error);
                $.notify("Server error. Please try again later.", "error");
            });
        });
    });
</script>

        </div>
    </div>


    <script src="./js/toggle.js?v=1.0"></script>
    <script src="./js/script.js?v=1.0"></script>
    <script src="./js/lang.js?v=1.0"></script>
</body>
</html>