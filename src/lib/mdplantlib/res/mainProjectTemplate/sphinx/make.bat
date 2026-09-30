@ECHO OFF

pushd %~dp0

REM Command file for Sphinx documentation

if "%SPHINXBUILD%" == "" (
	set SPHINXBUILD=sphinx-build
)
set SOURCEDIR=..
set BUILDDIR=%SOURCEDIR%/_build

if "%1" == ""           		goto help
if "%1" == "server"     		goto server
if "%1" == "docs"       		goto docs
if "%1" == "pip"        		goto pip

%SPHINXBUILD% >NUL 2>NUL
if errorlevel 9009 (
	echo.
	echo.The 'sphinx-build' command was not found. Make sure you have Sphinx
	echo.installed, then set the SPHINXBUILD environment variable to point
	echo.to the full path of the 'sphinx-build' executable. Alternatively you
	echo.may add the Sphinx directory to PATH.
	echo.
	echo.If you don't have Sphinx installed, grab it from
	echo.https://www.sphinx-doc.org/
	exit /b 1
)

echo F | xcopy %SOURCEDIR%\README.md %SOURCEDIR%\index.md /i /y
%SPHINXBUILD% -M %1 -c %SOURCEDIR%\sphinx -d %BUILDDIR%\doctrees %SOURCEDIR% %BUILDDIR%\html %SPHINXOPTS% %O%
del %SOURCEDIR%\index.md
goto end

:docs
rmdir /s /q %SOURCEDIR%\docs
xcopy /S /I /Q /Y /F %SOURCEDIR%\_build\html %SOURCEDIR%\docs
type nul > %SOURCEDIR%\docs\.nojekyll
echo F | xcopy CNAME %SOURCEDIR%\docs /i /y
goto end

:server
python3 -m http.server -d %BUILDDIR%\html 8080
goto end

:pip
pip3 install -r requirements.txt
goto end

:help
%SPHINXBUILD% -M help %SOURCEDIR% %BUILDDIR% %SPHINXOPTS% %O%

:end
popd
