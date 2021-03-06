const debugging = (window == top);
window.onload = function() {
    displaySchedule();
    displayDrafts();
    displayEmailAddress();

    // Set dates to today
    var curTime = moment().format('HH:mm');
    var curDate = moment().format('YYYY-MM-DD');
    document.querySelector('#date').value = curDate;
    document.querySelector('#time').value = curTime;

    // Adds date picker for browsers without date support
    loadPicker();

    setTimeout(function(){
        document.getElementById('myHTML').style.height = '100%';
        document.querySelector('#myHTML > body').style.height = '100%';
    }, 1000)
    /* NOTE 1: This is very hacky but what is happening is #myHTML must have height set to over 100% otherwise you can't scroll on mobile (if needed)
    This may be caused by this all being in an iframe and a lot of the height of the document rendering later.
    This basically sets the height back to 100% like normal
        */
};

function getEmailAddress(callback){
    if (debugging){
        let address = "email@email.com";
        callback(address);
    } else {
        google.script.run.withSuccessHandler(callback).getCurrentUser();
    }
}
function displayEmailAddress(){
    getEmailAddress(function(address){
        document.querySelector('#userEmail').innerText = address;
    })
}
function getDrafts(callback){
    if (debugging){
        let draftSubjects = ["Subject 1", "Subject 2", "etc", "Medium Article Examples", "Resume Inspiration",
         "iPod Print", "https://iwantwhatitsworth.com/","Lo And Behold: Reveries Of The Connected World"];
        callback(draftSubjects);
    } else {
        google.script.run.withSuccessHandler(callback).getDraftSubjects();
    }
}
function displayDrafts() {
    getDrafts(function (drafts) {
        var options = '';
        for (var draft of drafts) {
            options += '<option value="' + draft + '">' + draft + '<\/option>';
        }
        document.querySelector('#subjects').innerHTML = options;
        showLoading(false);
    })
}
function getSchedule(callback) {
    showLoading(true);
    if (debugging) {
        let scheduledEmails = [
            { "subject": "Resume Inspiration", "date": "2018-08-01T20:11:00.000Z" },
            { "subject": "iPod Print", "date": "2018-07-31T21:14:00.000Z" },
            { "subject": "SQL Stuffs", "date": "2018-08-01T20:11:00.000Z" }
        ];
        callback(scheduledEmails)
    } else {
        google.script.run.withSuccessHandler(callback).getScheduledEmails();
    }
}
function displaySchedule() {
    getSchedule(
        function (s) {
            var template = document.querySelector('#productrow');
            var newContents = document.createDocumentFragment();

            for (let message of s) {
                var formattedDate = moment(message.date).format('MMMM Do YYYY, hh:mm a');
                var clone = document.importNode(template.content, true);
                var td = clone.querySelectorAll("td");
                td[0].textContent = message.subject;
                td[1].textContent = formattedDate;
                td[2].addEventListener('click', function () { removeScheduledMessage(message.subject); });
                newContents.appendChild(clone);
            };

            //Deletes old table-items
            document.querySelectorAll('.table-item').forEach(function (e) { e.remove() });
            document.querySelector("tbody").appendChild(newContents);
            showLoading(false);
        }
        //function(s){console.log("hi")}
    )
}
function addScheduledMessage() {
    var date = document.querySelector('#date').value;
    var time = parseTime(document.querySelector('#time').value);
    var subject = document.querySelector('#subjects').value;
    var sendDate = new Date(date + " " + time);

    if (dateIsInFuture(sendDate)){
        sendDate = JSON.stringify(sendDate);
        showError(false);
        if (debugging){
            console.log("Submitting the following to Google: " + subject + sendDate)
        } else{
            google.script.run.addEmailToSchedule(subject, sendDate);
        }
        displaySchedule();
    } else {
        showError(true);
    }
}
function removeScheduledMessage(subject) {
    document.querySelectorAll('td').forEach(e => {if (e.innerText == subject) {e.parentNode.remove()}});
    if (debugging){
        console.log("Removing: " + subject);
    } else{
        google.script.run.removeEmailFromSchedule(subject);
    }
}

function loadPicker(){
    // Only loads if browser doesn't support input type="date"
    var dateField = document.createElement("input");
    dateField.setAttribute("type", "date");

    if (dateField.type != "date") {
        var head = document.querySelector('#myHTML > head');
        var script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/pikaday/1.6.1/pikaday.js";
        head.appendChild(script);

        var css = document.createElement("link");
        css.setAttribute("rel","stylesheet");
        css.setAttribute("type","text/css");
        css.href = "https://cdnjs.cloudflare.com/ajax/libs/pikaday/1.6.1/css/pikaday.min.css";
        head.appendChild(css);

        setTimeout(function(){
            var picker = new Pikaday({ field: document.getElementById('date') });
        }, 2000)
    }
}
function dateIsInFuture(formDate) {
    return moment(formDate).isAfter(new Date());
}

function parseTime(string){
    //Necessary to avoid adding another library for cross browser time support
    var isPM = string.toLowerCase().includes("p");
    var numbers = string.match(/\d+/g);
    var hours = parseInt(numbers[0]);
    var minutes = parseInt(numbers[1] | 0);
    if (isPM && hours != 12) hours += 12;
    return hours + ":" + minutes;
}

function showLoading(boolean){
    if (boolean){
        document.querySelector('#loader').classList.add('loader');
    } else {
        document.querySelector('#loader').classList.remove('loader');
    }
}

function showError(boolean) {
    if (boolean){
        document.querySelector('#dateTimeRow').classList.add("has-error");
        document.querySelector('.help-block').classList.remove("hidden");
    } else {
        document.querySelector('#dateTimeRow').classList.remove("has-error");
        document.querySelector('.help-block').classList.add("hidden");
    }
}





