def identify_content_type(code):
    # Keywords unique to Docker
    docker_indicators = ['FROM', 'WORKDIR', 'ENTRYPOINT', 'EXPOSE']
    if any(word in code for word in docker_indicators):
        return "DOCKER"
    return "SOURCE_CODE"