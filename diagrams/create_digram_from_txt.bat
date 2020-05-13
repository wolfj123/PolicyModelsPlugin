@echo off
set txt_name=%1
set name=%~n1
set image_format=.png
set image_name=%name%%image_format%
java -jar plantuml.jar %txt_name%
%image_name%
