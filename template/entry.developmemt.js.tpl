import './common.entry'

// import css files
<% styles.forEach(function(style){ %>
import '<%= style %>'
<% }); %>
