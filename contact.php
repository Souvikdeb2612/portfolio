<?php  
    $name=$_POST['name'];
    $visitor_email=$_POST['email'];
    $message =$_POST['message'];

    $mail_from='deb.souvik2612@gmail.com';
    $email_subject ='New potfolio message';
    $email_body="Username: $name.\n".
                "User Email: $visitor_email.\n".
                "User Message: $message.\n";

    $to ="souvikdeb26@gmail.com"
    $headers="From: $email_from\r\n";
    $headers ="Reply-to:$visitor_email\r\n";

    mail($to,$email_subject,$email_body,$headers);
    header("Location:index.html");



?>