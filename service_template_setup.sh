# TODO: this is kind of brittle because some inputs will not result in successful changes, but it will have to do for now.

echo -n 'Enter your project name: '
read project_name
echo

if [ "$project_name" == "" ]; then
  echo "Project name cannot be empty"
  exit 1
fi

echo -n 'Enter the external API port: '
read external_api_port
echo

if [ "$external_api_port" == "" ]; then
  echo "External API port cannot be empty"
  exit 1
fi

echo -n 'Enter external database port: '
read external_db_port
echo

if [ "$external_db_port" == "" ]; then
  echo "External database port cannot be empty"
  exit 1
fi

echo "replacing servicetemplate with $project_name"
sed -i '' "s/servicetemplate/$project_name/g" README.md docker-compose.dev.yml docker-compose.prod.yml package.json package-lock.json .env.local src/utils/swagger.ts src/index.ts

echo "replacing your external API port with $external_api_port"
sed -i '' "s/SERVICE_TEMPLATE_API_PORT/$external_api_port/g" README.md .env.local docker-compose.dev.yml

echo "replacing your external database port with $external_db_port"
sed -i '' "s/SERVICE_TEMPLATE_POSTGRES_PORT/$external_db_port/g" .env.local docker-compose.dev.yml