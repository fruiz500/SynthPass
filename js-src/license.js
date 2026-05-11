/*
@source: https://github.com/fruiz500/synthpass

@licstart  The following is the entire license notice for the
JavaScript code in this page.

Copyright (C) 2026  Francisco Ruiz

This software is released under the PolyForm Shield License 1.0.0.
Permission is granted to use, study, and modify this code for personal 
and non-commercial purposes. 

As a "Source-Available" project, "reading" or auditing the code does not 
constitute a license to redistribute, modify, or use the logic for 
commercial products or services.

Full license terms can be found at: 
https://polyformproject.org/licenses/shield/1.0.0/

@licend  The above is the entire license notice
for the JavaScript code in this page.
*/

if (window.location.protocol == "http:") { // force SSL/TLS
    var restOfUrl = window.location.href.substr(5);
    window.location = "https:" + restOfUrl;
}