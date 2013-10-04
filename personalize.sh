#!/bin/bash
read -p "The organization name: " orgName
read -p "The project name: " projectName
read -p "The root package path: " packagePath
sed -i "s/change-me-to-organization-name/$orgName/g" build.xml
sed -i "s/change-me-to-project-name/$projectName/g" build.xml

sed -i "s,change/me/to/your/project/package/name,$packagePath,g" build.xml

sed -i "s/change-me-to-organization-name/$orgName/g" ivy.xml
sed -i "s/change-me-to-project-name/$projectName/g" ivy.xml

sed -i "s/webhandle-plugin/$projectName/g" .project

echo "build.xml, .project, and ivy.xml changed"
