<html>
<?php
$username =  $_POST["username"];
$password = $_POST["password"];
$con = mysqli_connect('localhost', 'user', 'password','mysql') or die("Coudn't connect!");
$result = mysqli_query($con, "select* from investor");
$flag = -1;
while($row = $result->fetch_assoc()){
    echo $password;
    echo $row["password"];
    if($row["username"]==$username && $row["password"] == $password){
        $flag = 0;
        break;
    }
}
if ($flag == 0){
$myDomain = ereg_replace("^[^.]*.([^.]*).(.*)$", '1.2', $_SERVER['HTTP_HOST']);
$setDomain = ($_SERVER['HTTP_HOST']) != "localhost" ? ".$myDomain" : false;
setcookie ("loggedin", 'true', time()+3600*24*(2), '/', "$setDomain", 0 );
setcookie ("username", $username, time()+3600*24*(2), '/', "$setDomain", 0 );

  header("Location: http://localhost:3500/home");
}
else{
header("Location: http://localhost/stock-simulator/#");
}
?>
</html>
