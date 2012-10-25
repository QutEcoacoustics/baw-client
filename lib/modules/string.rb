class String
  def trim(replace_chars, substitute_chars)
    "#{self}".gsub(/^[#{substitute_chars}]+|[#{substitute_chars}]+$/, replace_chars)
  end
end