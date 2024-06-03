<% if(logo) { %><img align="right" src="<%= logo %>" /><%= '\n\n' %><% } %># <%= title %>
<% if(intro) { %><%= '\n' %>_<%= intro %>_<%= '\n' %><% } %><% if(version && (version.name || version.number)) { %><%= '\n' %>##<% if(version.name){%> <%= version.name %><% } %> <%= version.number %> <% if(version.date){ %>( <%= version.date %> )<% } %><%= '\n' %><% } %><% _.forEach(sections, function(section){ if(section.commitsCount > 0) { %>
### <%= section.title %><%= '\n' %>
<% _.forEach(section.commits, function(commit){ %>- <%= printCommit(commit) %><%= '\n' %><% }) %><% _.forEach(section.components, function(component){ %>- **<%= component.name %>**<%= '\n' %><% _.forEach(component.commits, function(commit){ %>    - <%= printCommit(commit) %><%= '\n' %><% }) %>
<% }) %><% } %><% }) %>