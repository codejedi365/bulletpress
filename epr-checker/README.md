# EPR Checker
### A bullet analysis tool

EPR Checker is a tool that performs lexical analysis of EPR bullets.  Below are some of the features it includes:
- Abbreviation conflict detection:  compiles a list of possible abbreviation conflicts, such as "ldrshp -> leadership"
- Acronym extraction:  acronyms used are compiled into a list
- Remarks Section generation:  automatically strings together acronyms with their descriptions as descriptions are input
- Metadata generation:  word counts, numbers used

---

# Reporting Issues
Currently, you'll have to sign in to Github in order to submit an issue.  When reporting an issue, please be sure to include your web browser version, what steps to take to replicate the issue, and any error messages, screenshots, or anything else that may be helpful for debugging purposes.

---

# History

I started creating EPR Checker as a result of my work on an initial draft of my own EPR.  At the time, my supervisor was doing a great job at taking care of me, and I was having a good time getting involved with my squadron, so I decided I wanted to do everything in my power to make their jobs easier when it came to reviewing my EPR.

So I created a solid rough draft of the EPR, and was scouring it for any and all discrepancies in accordance with the rules/guidance governing its content.  After a while, I found myself just staring at a wall of text, and grew concerned that I'd start missing things if I wasn't careful.

I've grown fond of manipulating and transforming raw data over the years, so I decided I'd try leveraging my programming/data analysis skills to examine the contents of my EPR, rather than rely on reading through it word by word.  So I cracked open a Python console, dumped my EPR text into it, and went to work splitting and comparing strings, compiling regular expressions, and just had fun with it.

I did this analysis in a Python console the night before I wanted to turn my draft in to my supervisor, and ended up repeating the same process the following morning for one final check.  As I was repeating the process, I was also clumping bits of code for the console together in Notepad++ on the side for reuse, and the thought crossed my mind, "I wonder if I could make a proper tool out of this?"

So I mocked something up in Javascript, originally just a blank white page with a single, massive textbox on it, and started playing around with the theory.  Over time, I met with various people who I believed may benefit from this sort of functionality, and who were willing to offer me feedback on the design of the tool.  Their input, coupled with my implementation, is what got the tool to be what it is today.

---

# Frequently Asked Questions

### What web browsers are supported?
EPR Checker has been tested against and is compatible with Firefox, Edge, Chrome, and Internet Explorer 11.  If you are experiencing issues with your particular browser, please submit an issue and I'll look into supporting it.

### Does EPR Checker keep a copy of my bullets?
No.  All of the processing and analysis EPR Checker does is done client-side (on your computer).

### Why "EPR Checker"?  That name's kinda lame...
I chose the name "EPR Checker" because I wanted something plain and on-the-nose.  I believe that cool names have to be earned, not given, and dull names can also act as a sort of safeguard against requirements creep and can keep expectations grounded in reality.

[Here's](http://theengineeringmanager.com/growth/project-x/) an interesting (fictional) story about the sort of damage a wild project name can do.

### Why are non-abbreviations appearing on the abbreviation list? (i.e. big -> beginning)
The simple answer here is that I prefer false positives over false negatives when it comes to this tools' outputs.  I would rather have to comb through a short list of possible conflicts that aren't actual issues, versus not seeing something that is a real problem I'd catch flak for later on down the road.
