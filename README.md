# SynthPass
is a password synthesizer, which generates passwords on the fly rather than storing them like conventional password managers. it is conceived as an extension for Chrome or an add-on for Firefox. The only difference between the two is a few lines in the manifest.json file, and this is why there are two of them in the repo (should be renamed manifest.json before use).
SynthPass has its own Help page, and there is an information website at https://synthpass.weebly.com

With SynthPass, there is no "vault" that has to be protected from hackers because your passwords are synthesized on the fly, just as you need them. SynthPass-made passwords are always high strength and comprise letters, numbers, and special characters. Passwords for different websites are guaranteed to be totally different.

Users never have to change their Master Password. When a website forces you to change its password, simply change the optional serial that is used to synthesize that password. SynthPass will remember the serial, as well as your user ID. Your Master Password will never be stored, and it disappears from memory after five minutes not using it.

Unlike conventional password managers, SynthPass 
- won't pop up and interrupt your flow; it is activated only when you click its icon on the browser toolbar
- won't store anything secret, only user IDs and optional serials, if you allow it
- is always available, because it does not have to connect to "the Cloud"
- makes only strong passwords
- won't ask you for money
- won't show ads

SynthPass is based on the WiseHash key-stretching algorithm, also available at GitHub, which evaluates the information entropy of your Master Password and subjects it to a variable number of rounds of SCRYPT key-stretching. The weaker the password, the more stretching. This forces would-be hackers to spend an inordinate amount of computer time testing weak passwords before they can get to yours. SynthPass displays an accurate measurement of your Master Password's entropy to help you come up with a strong one. This is the same algorithm stretching the user password in PassLok Privacy and PassLok for Email, also in this web store.

This is a browser extension, and therefore is poorly supported on mobile devices. There is, however, a web app that includes the same password-making engine and runs well on mobile devices. It can be found at:

https://synthpass.com/app  and also at https://github.com/fruiz500/synthpass-standalone

# Credits:
- smart Password engine based on WiseHash by F. Ruiz 2014: https://github.com/fruiz500/wisehash
- engine: NaCl by D. Bernstein, W. Janssen, T. Lange, P. Schwabe, M. Dempsky, and A. Moon 2013
- tweetNaCl JavaScript implementation by D. Chestnykh and D. Mandiri 2015: https://github.com/fruiz500/wisehash
- scrypt key stretching implementation by D. Chestnykh 2014: https://github.com/fruiz500/wisehash

# Usage of the extension (also in help.html)
The extension is available for Chrome and its derivatives and for Firefox. Here are the links:

Chrome: https://chrome.google.com/webstore/detail/synthpass/khkpfnickpejcjhajmkljfadcaegphkd

Firefox: https://addons.mozilla.org/en-US/firefox/addon/synthpass/

When a password field is visible on a webpage, do this:

1. Click the SynthPass logo, located on the upper right of the browser.
2. A popup box will appear, containing writable boxes for your Master Password and an optional serial, plus the user ID if there is a single extra box on the webpage. The serial box will be filled already if you used a serial on this website before, as well as the user ID. If you have used your Master Password within the last five minutes, this box will be filled as well. Type in your Master Password if needed (you can make it visible by clicking the checkbox) and click OK or press the Enter key.
3. When the popup disappears, the password and user ID fields on the webpage will be filled, but login has not yet taken place. Proceed from this point as if you had typed in user ID and password directly into the webpage.
If the popup says that it cannot see the password field or displays more than one box for the Master Password, you may need to paste in the synthesized password manually. There is a special form for this in the Help page.

To change a password on a website:

Typically you will reach a page displaying at least two password fields, one for the old password and one for the new. Sometimes you are asked to repeat the new password, or the old, or both. In this case clicking the SynthPass logo will open a popup containing several rows, one for each password field on the webpage, arranged in the same order. This is what you do next:

1. Type in your Master Password in the box or boxes corresponding to the old password. Type the old serial, which should appear on the first row, into the boxes next to them. Add the user ID, if the box is not populated already. SynthPass does not read the instructions on the page, and therefore cannot identify automatically the input fields meant for the old and the new passwords, but you can. If you omit typing in a password or serial box, SynthPass will use the value in the box above it. To use the Master Password as-is, without any synthesis, type a single dash ( - ) in the serial box to its right.
2. Do the same for the box or boxes corresponding to the new password. Typically this will involve simply a new serial, and in this case it is enought to type it in the corresponding box or boxes. Again, if a box is left empty, the value above it will be used. To revert to not using a serial, type a space in that serial field.
3. To make SynthPass remember the new serial, click on it or the password box to its left so it is highlighted before clicking OK. Then click OK.
4. When the popup disappears, all the password fields, new and old, will be filled. Proceed from this point as if you had filled them manually.
If the number of rows in the popup is not the same as the number of password fields, or there are more than four of them, you may need to paste in the synthesized passwords manually. The process for this is explained in the Help page.
