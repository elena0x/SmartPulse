CREATE OR REPLACE FUNCTION public.on_new_hcp_tag()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_hcp_name text;
  v_hospital text;
BEGIN
  SELECT name, institution INTO v_hcp_name, v_hospital
  FROM public.hcp_profiles
  WHERE hcp_id = NEW.hcp_id
  LIMIT 1;

  IF v_hcp_name IS NULL THEN
    v_hcp_name := NEW.hcp_id;
    v_hospital := '';
  END IF;

  INSERT INTO public.signals (
    hcp_id, hcp_name, hospital, signal_type, summary, priority, tags
  ) VALUES (
    NEW.hcp_id,
    v_hcp_name,
    COALESCE(v_hospital, ''),
    '标签变更',
    '新增标签 [' || NEW.tag_key || ': ' || NEW.tag_value || ']，来源: ' || COALESCE(NEW.source, 'unknown'),
    'medium',
    ARRAY[NEW.tag_value]
  );

  RETURN NEW;
END;
$function$;