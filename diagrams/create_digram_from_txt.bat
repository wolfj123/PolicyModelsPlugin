@echo off
set txt_name=%1
set name = %~n1
set image_format = .png
set image_name=%filename%%image_format%
java -jar ..\utils\plantuml.jar %txt_name%
